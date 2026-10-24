import { db } from './db';
import {
  BackupEnvelope,
  MeasurementEntry,
  UserSettings,
  ExerciseDefinition,
  WorkoutSession,
  QuestItem,
  ProgressPhoto,
  SerializedPhotoRecord,
} from '../domain/types';

// ==========================================
// ISOMORPHIC BLOB <-> BASE64 HELPERS
// ==========================================

export async function blobToBase64(blob: Blob): Promise<string> {
  const arrayBuffer = await blob.arrayBuffer();
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(arrayBuffer).toString('base64');
  }
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64');
    return new Blob([buffer], { type: mimeType });
  }
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

// ==========================================
// EXPORT SYSTEM DATA
// ==========================================

export async function exportSystemBackup(): Promise<BackupEnvelope> {
  const settings = await db.settings.toArray();
  const measurements = await db.measurements.toArray();
  const exercises = await db.exercises.toArray();
  const workouts = await db.workouts.toArray();
  const rawPhotos = await db.photos.toArray();
  const quests = await db.quests.toArray();

  const serializedPhotos: SerializedPhotoRecord[] = [];
  for (const photo of rawPhotos) {
    const base64Data = await blobToBase64(photo.blob);
    serializedPhotos.push({
      id: photo.id,
      date: photo.date,
      category: photo.category,
      base64Data,
      mimeType: photo.mimeType,
      fileSize: photo.fileSize,
      notes: photo.notes,
      createdAt: photo.createdAt,
    });
  }

  const envelope: BackupEnvelope = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    checksum: {
      recordCounts: {
        settings: settings.length,
        measurements: measurements.length,
        exercises: exercises.length,
        workouts: workouts.length,
        photos: serializedPhotos.length,
        quests: quests.length,
      },
    },
    data: {
      settings,
      measurements,
      exercises,
      workouts,
      photos: serializedPhotos,
      quests,
    },
  };

  return envelope;
}

// ==========================================
// VALIDATION & RESTORE
// ==========================================

export interface BackupValidationResult {
  isValid: boolean;
  errorMessage?: string;
  parsedEnvelope?: BackupEnvelope;
}

export function validateBackupJson(rawJson: string | unknown): BackupValidationResult {
  try {
    const parsed = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, errorMessage: 'Backup payload must be a non-null JSON object.' };
    }

    const envelope = parsed as Partial<BackupEnvelope>;

    if (envelope.schemaVersion !== 1) {
      return {
        isValid: false,
        errorMessage: `Unsupported schema version: ${envelope.schemaVersion}. Expected 1.`,
      };
    }

    if (!envelope.data || typeof envelope.data !== 'object') {
      return { isValid: false, errorMessage: 'Corrupted backup: Missing "data" payload object.' };
    }

    const { settings, measurements, exercises, workouts, photos, quests } = envelope.data;

    if (!Array.isArray(settings)) {
      return { isValid: false, errorMessage: 'Corrupted data: "settings" must be an array.' };
    }
    if (!Array.isArray(measurements)) {
      return { isValid: false, errorMessage: 'Corrupted data: "measurements" must be an array.' };
    }
    if (!Array.isArray(exercises)) {
      return { isValid: false, errorMessage: 'Corrupted data: "exercises" must be an array.' };
    }
    if (!Array.isArray(workouts)) {
      return { isValid: false, errorMessage: 'Corrupted data: "workouts" must be an array.' };
    }
    if (!Array.isArray(photos)) {
      return { isValid: false, errorMessage: 'Corrupted data: "photos" must be an array.' };
    }
    if (!Array.isArray(quests)) {
      return { isValid: false, errorMessage: 'Corrupted data: "quests" must be an array.' };
    }

    // Deep check entity minimum shape
    for (const m of measurements) {
      if (!m.id || !m.date) {
        return { isValid: false, errorMessage: 'Invalid measurement entry: Missing id or date.' };
      }
    }
    for (const w of workouts) {
      if (!w.id || !w.date || !Array.isArray(w.exercises)) {
        return { isValid: false, errorMessage: 'Invalid workout entry: Missing id, date, or exercises array.' };
      }
    }
    for (const p of photos) {
      if (!p.id || !p.base64Data || !p.mimeType) {
        return { isValid: false, errorMessage: 'Invalid photo record: Missing id, base64Data, or mimeType.' };
      }
    }

    return {
      isValid: true,
      parsedEnvelope: envelope as BackupEnvelope,
    };
  } catch (err) {
    return {
      isValid: false,
      errorMessage: `JSON Parse Failure: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

export async function restoreSystemBackup(
  backupInput: string | BackupEnvelope,
  mode: 'replace' | 'merge' = 'replace'
): Promise<{ success: boolean; message: string; recordCounts: Record<string, number> }> {
  const validation = validateBackupJson(backupInput);
  if (!validation.isValid || !validation.parsedEnvelope) {
    throw new Error(validation.errorMessage || 'Invalid backup envelope.');
  }

  const envelope = validation.parsedEnvelope;
  const { settings, measurements, exercises, workouts, photos, quests } = envelope.data;

  // Convert Base64 back to Blobs
  const restoredPhotos: ProgressPhoto[] = photos.map((p) => {
    const blob = base64ToBlob(p.base64Data, p.mimeType);
    return {
      id: p.id,
      date: p.date,
      category: p.category,
      blob,
      mimeType: p.mimeType,
      fileSize: p.fileSize || blob.size,
      notes: p.notes,
      createdAt: p.createdAt || new Date().toISOString(),
    };
  });

  // Execute atomic transaction across all tables
  await db.transaction(
    'rw',
    [db.settings, db.measurements, db.exercises, db.workouts, db.photos, db.quests],
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.settings.clear(),
          db.measurements.clear(),
          db.exercises.clear(),
          db.workouts.clear(),
          db.photos.clear(),
          db.quests.clear(),
        ]);
      }

      if (settings.length > 0) {
        await db.settings.bulkPut(settings as UserSettings[]);
      }
      if (measurements.length > 0) {
        await db.measurements.bulkPut(measurements as MeasurementEntry[]);
      }
      if (exercises.length > 0) {
        await db.exercises.bulkPut(exercises as ExerciseDefinition[]);
      }
      if (workouts.length > 0) {
        await db.workouts.bulkPut(workouts as WorkoutSession[]);
      }
      if (restoredPhotos.length > 0) {
        await db.photos.bulkPut(restoredPhotos);
      }
      if (quests.length > 0) {
        await db.quests.bulkPut(quests as QuestItem[]);
      }
    }
  );

  return {
    success: true,
    message: `System restored successfully in ${mode.toUpperCase()} mode.`,
    recordCounts: {
      settings: settings.length,
      measurements: measurements.length,
      exercises: exercises.length,
      workouts: workouts.length,
      photos: restoredPhotos.length,
      quests: quests.length,
    },
  };
}

export async function purgeAllLocalData(): Promise<void> {
  await db.transaction(
    'rw',
    [db.settings, db.measurements, db.exercises, db.workouts, db.photos, db.quests],
    async () => {
      await Promise.all([
        db.settings.clear(),
        db.measurements.clear(),
        db.exercises.clear(),
        db.workouts.clear(),
        db.photos.clear(),
        db.quests.clear(),
      ]);
    }
  );
}
