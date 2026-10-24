import { db, initializeDatabase } from './db';
import {
  UserSettings,
  MeasurementEntry,
  ExerciseDefinition,
  WorkoutSession,
  ProgressPhoto,
  QuestItem,
} from '../domain/types';
import { validateMeasurementEntry, isSetAPersonalRecord } from '../domain/math';

// ==========================================
// SETTINGS REPOSITORY
// ==========================================

export const SettingsRepo = {
  async get(): Promise<UserSettings> {
    await initializeDatabase();
    const config = await db.settings.get('system-config');
    if (!config) {
      const today = new Date().toISOString().slice(0, 10);
      const fallback: UserSettings = {
        id: 'system-config',
        unitSystem: 'metric',
        journeyStartDate: today,
        currentArcName: 'FOUNDATION ARC',
        reducedMotion: false,
        schemaVersion: 1,
      };
      await db.settings.put(fallback);
      return fallback;
    }
    return config;
  },

  async update(patch: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.get();
    const updated: UserSettings = {
      ...current,
      ...patch,
      id: 'system-config',
      schemaVersion: 1,
    };
    await db.settings.put(updated);
    return updated;
  },
};

// ==========================================
// MEASUREMENTS REPOSITORY
// ==========================================

export const MeasurementsRepo = {
  async getAll(): Promise<MeasurementEntry[]> {
    const list = await db.measurements.toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async getById(id: string): Promise<MeasurementEntry | undefined> {
    return await db.measurements.get(id);
  },

  async create(entry: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeasurementEntry> {
    const validation = validateMeasurementEntry(entry);
    if (!validation.isValid) {
      const msg = Object.values(validation.errors).join('; ');
      throw new Error(`Measurement validation failed: ${msg}`);
    }

    const now = new Date().toISOString();
    const newEntry: MeasurementEntry = {
      ...entry,
      id: crypto.randomUUID(),
      standardMetrics: entry.standardMetrics || {},
      customMetrics: entry.customMetrics || {},
      createdAt: now,
      updatedAt: now,
    };

    await db.measurements.put(newEntry);
    return newEntry;
  },

  async update(id: string, patch: Partial<MeasurementEntry>): Promise<MeasurementEntry> {
    const existing = await db.measurements.get(id);
    if (!existing) {
      throw new Error(`Measurement record with id ${id} not found.`);
    }

    const updatedData: MeasurementEntry = {
      ...existing,
      ...patch,
      id,
      standardMetrics: {
        ...existing.standardMetrics,
        ...(patch.standardMetrics || {}),
      },
      customMetrics: {
        ...existing.customMetrics,
        ...(patch.customMetrics || {}),
      },
      updatedAt: new Date().toISOString(),
    };

    const validation = validateMeasurementEntry(updatedData);
    if (!validation.isValid) {
      const msg = Object.values(validation.errors).join('; ');
      throw new Error(`Measurement validation failed: ${msg}`);
    }

    await db.measurements.put(updatedData);
    return updatedData;
  },

  async delete(id: string): Promise<void> {
    await db.measurements.delete(id);
  },
};

// ==========================================
// EXERCISES REPOSITORY
// ==========================================

export const ExercisesRepo = {
  async getAll(): Promise<ExerciseDefinition[]> {
    await initializeDatabase();
    const list = await db.exercises.toArray();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  },

  async create(exercise: Omit<ExerciseDefinition, 'id'>): Promise<ExerciseDefinition> {
    if (!exercise.name || !exercise.name.trim()) {
      throw new Error('Exercise name cannot be empty.');
    }
    const newEx: ExerciseDefinition = {
      ...exercise,
      id: crypto.randomUUID(),
      name: exercise.name.trim(),
    };
    await db.exercises.put(newEx);
    return newEx;
  },

  async update(id: string, patch: Partial<ExerciseDefinition>): Promise<ExerciseDefinition> {
    const existing = await db.exercises.get(id);
    if (!existing) throw new Error(`Exercise ${id} not found.`);
    const updated: ExerciseDefinition = {
      ...existing,
      ...patch,
      id,
    };
    await db.exercises.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.exercises.delete(id);
  },
};

// ==========================================
// WORKOUTS REPOSITORY
// ==========================================

export const WorkoutsRepo = {
  async getAll(): Promise<WorkoutSession[]> {
    const list = await db.workouts.toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async getById(id: string): Promise<WorkoutSession | undefined> {
    return await db.workouts.get(id);
  },

  async create(session: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkoutSession> {
    if (!session.date || !/^\d{4}-\d{2}-\d{2}$/.test(session.date)) {
      throw new Error('Valid workout date (YYYY-MM-DD) is required.');
    }

    const allSessions = await this.getAll();
    const now = new Date().toISOString();

    // Check PRs for all sets in this session
    const processedExercises = (session.exercises || []).map((ex) => {
      const processedSets = (ex.sets || []).map((s, idx) => {
        const setWithId = {
          ...s,
          id: s.id || crypto.randomUUID(),
          setNumber: idx + 1,
        };
        const isPR = isSetAPersonalRecord(setWithId, ex.exerciseId, ex.category, allSessions);
        return {
          ...setWithId,
          isPR,
        };
      });
      return {
        ...ex,
        id: ex.id || crypto.randomUUID(),
        sets: processedSets,
      };
    });

    const newSession: WorkoutSession = {
      ...session,
      id: crypto.randomUUID(),
      exercises: processedExercises,
      createdAt: now,
      updatedAt: now,
    };

    await db.workouts.put(newSession);
    return newSession;
  },

  async update(id: string, patch: Partial<WorkoutSession>): Promise<WorkoutSession> {
    const existing = await db.workouts.get(id);
    if (!existing) throw new Error(`Workout session ${id} not found.`);

    const allSessions = await this.getAll();
    const now = new Date().toISOString();

    let processedExercises = existing.exercises;
    if (patch.exercises) {
      processedExercises = patch.exercises.map((ex) => {
        const processedSets = (ex.sets || []).map((s, idx) => {
          const setWithId = {
            ...s,
            id: s.id || crypto.randomUUID(),
            setNumber: idx + 1,
          };
          const isPR = isSetAPersonalRecord(setWithId, ex.exerciseId, ex.category, allSessions, id);
          return {
            ...setWithId,
            isPR,
          };
        });
        return {
          ...ex,
          id: ex.id || crypto.randomUUID(),
          sets: processedSets,
        };
      });
    }

    const updated: WorkoutSession = {
      ...existing,
      ...patch,
      id,
      exercises: processedExercises,
      updatedAt: now,
    };

    await db.workouts.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.workouts.delete(id);
  },

  async logRecoveryDay(date: string, notes?: string): Promise<WorkoutSession> {
    const now = new Date().toISOString();
    const recoverySession: WorkoutSession = {
      id: crypto.randomUUID(),
      date,
      title: 'Active Recovery & Regeneration',
      notes: notes || 'Deliberate nervous system & muscular recovery protocol.',
      isRecoveryDay: true,
      exercises: [],
      createdAt: now,
      updatedAt: now,
    };
    await db.workouts.put(recoverySession);
    return recoverySession;
  },
};

// ==========================================
// PHOTOS REPOSITORY
// ==========================================

export const MAX_PHOTO_BYTES = 15 * 1024 * 1024; // 15MB

export const PhotosRepo = {
  async getAll(): Promise<ProgressPhoto[]> {
    const list = await db.photos.toArray();
    return list.sort((a, b) => b.date.localeCompare(a.date));
  },

  async getById(id: string): Promise<ProgressPhoto | undefined> {
    return await db.photos.get(id);
  },

  async create(photo: Omit<ProgressPhoto, 'id' | 'createdAt'>): Promise<ProgressPhoto> {
    if (!photo.blob) {
      throw new Error('Photo blob is required.');
    }
    if (photo.blob.size > MAX_PHOTO_BYTES) {
      throw new Error('Image exceeds maximum allowed size of 15MB.');
    }
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validMimes.includes(photo.mimeType.toLowerCase())) {
      throw new Error(`Unsupported image type: ${photo.mimeType}. Accepted: JPEG, PNG, WEBP.`);
    }

    const newPhoto: ProgressPhoto = {
      ...photo,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    await db.photos.put(newPhoto);
    return newPhoto;
  },

  async delete(id: string): Promise<void> {
    await db.photos.delete(id);
  },
};

// ==========================================
// QUESTS REPOSITORY
// ==========================================

export const QuestsRepo = {
  async getAll(): Promise<QuestItem[]> {
    await initializeDatabase();
    const list = await db.quests.toArray();
    const typeOrder = { daily: 1, weekly: 2, milestone: 3 };
    return list.sort((a, b) => {
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.createdAt.localeCompare(b.createdAt);
    });
  },

  async toggleComplete(id: string): Promise<QuestItem> {
    const quest = await db.quests.get(id);
    if (!quest) throw new Error(`Quest ${id} not found.`);

    const now = new Date().toISOString();
    const newCompleted = !quest.completed;
    const updated: QuestItem = {
      ...quest,
      completed: newCompleted,
      currentValue: newCompleted ? quest.targetValue : 0,
      lastCompletedDate: newCompleted ? now.slice(0, 10) : quest.lastCompletedDate,
      updatedAt: now,
    };
    await db.quests.put(updated);
    return updated;
  },

  async updateProgress(id: string, currentValue: number): Promise<QuestItem> {
    const quest = await db.quests.get(id);
    if (!quest) throw new Error(`Quest ${id} not found.`);

    const now = new Date().toISOString();
    const completed = currentValue >= quest.targetValue;
    const updated: QuestItem = {
      ...quest,
      currentValue,
      completed,
      lastCompletedDate: completed ? now.slice(0, 10) : quest.lastCompletedDate,
      updatedAt: now,
    };
    await db.quests.put(updated);
    return updated;
  },

  async create(quest: Omit<QuestItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestItem> {
    if (!quest.title || !quest.title.trim()) {
      throw new Error('Quest directive title cannot be empty.');
    }
    const now = new Date().toISOString();
    const newQuest: QuestItem = {
      ...quest,
      id: crypto.randomUUID(),
      title: quest.title.trim(),
      createdAt: now,
      updatedAt: now,
    };
    await db.quests.put(newQuest);
    return newQuest;
  },

  async update(id: string, patch: Partial<QuestItem>): Promise<QuestItem> {
    const existing = await db.quests.get(id);
    if (!existing) throw new Error(`Quest ${id} not found.`);
    const now = new Date().toISOString();
    const updated: QuestItem = {
      ...existing,
      ...patch,
      id,
      updatedAt: now,
    };
    await db.quests.put(updated);
    return updated;
  },

  async delete(id: string): Promise<void> {
    await db.quests.delete(id);
  },
};
