import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../db/db';
import {
  MeasurementsRepo,
  WorkoutsRepo,
  PhotosRepo,
  SettingsRepo,
  QuestsRepo,
  ExercisesRepo,
} from '../db/repositories';
import { exportSystemBackup, restoreSystemBackup, validateBackupJson } from '../db/backup';
import { calculateSystemXP, validateMeasurementEntry } from '../domain/math';

describe('Anime Physique OS // System Core Integrity Tests', () => {
  beforeEach(async () => {
    // Clear all tables before each test
    await Promise.all([
      db.settings.clear(),
      db.measurements.clear(),
      db.exercises.clear(),
      db.workouts.clear(),
      db.photos.clear(),
      db.quests.clear(),
    ]);
  });

  // ========================================================
  // 1. BIOMETRIC MEASUREMENTS (CRUD + VALIDATION)
  // ========================================================
  describe('Gate 1: Biometric Measurements Engine', () => {
    it('creates, retrieves, updates, and deletes valid measurement entries', async () => {
      const created = await MeasurementsRepo.create({
        date: '2026-10-24',
        unit: 'cm',
        bodyweightKg: 82.5,
        standardMetrics: {
          chest: 108.5,
          waist: 79.0,
          leftUpperArm: 40.2,
          rightUpperArm: 40.5,
        },
        customMetrics: {
          neckToShoulderDelta: 12.0,
        },
        notes: 'Cold morning check after fast.',
      });

      expect(created.id).toBeDefined();
      expect(created.bodyweightKg).toBe(82.5);

      const retrieved = await MeasurementsRepo.getById(created.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.standardMetrics.chest).toBe(108.5);

      // Update waist and add thigh
      const updated = await MeasurementsRepo.update(created.id, {
        standardMetrics: {
          waist: 78.5,
          leftThigh: 61.0,
        },
      });
      expect(updated.standardMetrics.waist).toBe(78.5);
      expect(updated.standardMetrics.chest).toBe(108.5); // Preserved
      expect(updated.standardMetrics.leftThigh).toBe(61.0);

      // Delete
      await MeasurementsRepo.delete(created.id);
      const afterDelete = await MeasurementsRepo.getById(created.id);
      expect(afterDelete).toBeUndefined();
    });

    it('rejects invalid, impossible, or negative biometric inputs strictly', async () => {
      // Negative bodyweight
      await expect(
        MeasurementsRepo.create({
          date: '2026-10-24',
          unit: 'cm',
          bodyweightKg: -10,
          standardMetrics: {},
          customMetrics: {},
        })
      ).rejects.toThrow();

      // Absurd body site measurement (> 300cm)
      await expect(
        MeasurementsRepo.create({
          date: '2026-10-24',
          unit: 'cm',
          bodyweightKg: 75,
          standardMetrics: {
            chest: 999,
          },
          customMetrics: {},
        })
      ).rejects.toThrow();

      // Impossible low measurement (< 5cm)
      const lowResult = validateMeasurementEntry({
        date: '2026-10-24',
        unit: 'cm',
        standardMetrics: {
          waist: 2.0,
        },
      });
      expect(lowResult.isValid).toBe(false);
      expect(lowResult.errors['standardMetrics.waist']).toBeDefined();
    });
  });

  // ========================================================
  // 2. WORKOUT LOGGER & AUTOMATIC PR DETECTION
  // ========================================================
  describe('Gate 2: Workout Logger & PR Detection', () => {
    it('creates workout sessions and accurately detects PRs against identical parameters', async () => {
      // First session: Bench Press 100kg x 5 reps (First time is a baseline PR)
      const session1 = await WorkoutsRepo.create({
        date: '2026-10-10',
        title: 'Tactical Push Alpha',
        exercises: [
          {
            id: 'ex-log-1',
            exerciseId: 'ex-bench',
            exerciseName: 'Flat Barbell Bench Press',
            category: 'weighted',
            sets: [
              {
                id: 'set-1',
                setNumber: 1,
                weight: 100,
                weightUnit: 'kg',
                reps: 5,
              },
            ],
          },
        ],
      });

      expect(session1.exercises[0].sets[0].isPR).toBe(true);

      // Second session: Bench Press 100kg x 5 reps (Same weight, same reps -> NOT a PR)
      const session2 = await WorkoutsRepo.create({
        date: '2026-10-15',
        title: 'Tactical Push Beta',
        exercises: [
          {
            id: 'ex-log-2',
            exerciseId: 'ex-bench',
            exerciseName: 'Flat Barbell Bench Press',
            category: 'weighted',
            sets: [
              {
                id: 'set-2',
                setNumber: 1,
                weight: 100,
                weightUnit: 'kg',
                reps: 5,
              },
            ],
          },
        ],
      });

      expect(session2.exercises[0].sets[0].isPR).toBe(false);

      // Third session: Bench Press 105kg x 3 reps (Heavier weight -> PR!)
      const session3 = await WorkoutsRepo.create({
        date: '2026-10-20',
        title: 'Tactical Push Gamma',
        exercises: [
          {
            id: 'ex-log-3',
            exerciseId: 'ex-bench',
            exerciseName: 'Flat Barbell Bench Press',
            category: 'weighted',
            sets: [
              {
                id: 'set-3',
                setNumber: 1,
                weight: 105,
                weightUnit: 'kg',
                reps: 3,
              },
            ],
          },
        ],
      });

      expect(session3.exercises[0].sets[0].isPR).toBe(true);

      // Bodyweight PR check: Pull-Ups
      const bwSession1 = await WorkoutsRepo.create({
        date: '2026-10-21',
        title: 'Pull Protocol 1',
        exercises: [
          {
            id: 'ex-log-bw-1',
            exerciseId: 'ex-pullup',
            exerciseName: 'Strict Pull-Up',
            category: 'bodyweight',
            sets: [
              {
                id: 'set-bw-1',
                setNumber: 1,
                isBodyweight: true,
                reps: 15,
              },
            ],
          },
        ],
      });
      expect(bwSession1.exercises[0].sets[0].isPR).toBe(true);

      const bwSession2 = await WorkoutsRepo.create({
        date: '2026-10-23',
        title: 'Pull Protocol 2',
        exercises: [
          {
            id: 'ex-log-bw-2',
            exerciseId: 'ex-pullup',
            exerciseName: 'Strict Pull-Up',
            category: 'bodyweight',
            sets: [
              {
                id: 'set-bw-2',
                setNumber: 1,
                isBodyweight: true,
                reps: 18,
              },
            ],
          },
        ],
      });
      expect(bwSession2.exercises[0].sets[0].isPR).toBe(true);
    });

    it('logs an active recovery day and updates system XP transparently without penalty', async () => {
      const recoverySession = await WorkoutsRepo.logRecoveryDay('2026-10-24', 'Mobility and hydrotherapy.');
      expect(recoverySession.isRecoveryDay).toBe(true);

      const allWorkouts = await WorkoutsRepo.getAll();
      const rank = calculateSystemXP(allWorkouts, [], []);
      expect(rank.currentXP).toBe(40); // 40 XP for recovery day
      expect(rank.totalWorkouts).toBe(1);
    });
  });

  // ========================================================
  // 3. PROGRESS PHOTO VAULT (BLOBS IN INDEXEDDB)
  // ========================================================
  describe('Gate 3: Progress Photo Vault (Binary Storage)', () => {
    it('stores, retrieves, and deletes binary Blobs in IndexedDB', async () => {
      const dummyImageData = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
      const testBlob = new Blob([dummyImageData], { type: 'image/png' });

      const photo = await PhotosRepo.create({
        date: '2026-10-24',
        category: 'Front Double Biceps',
        blob: testBlob,
        mimeType: 'image/png',
        fileSize: testBlob.size,
        notes: 'Morning lighting check.',
      });

      expect(photo.id).toBeDefined();
      expect(photo.fileSize).toBe(testBlob.size);

      const retrieved = await PhotosRepo.getById(photo.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.blob).toBeInstanceOf(Blob);
      expect(retrieved?.blob.size).toBe(testBlob.size);

      // Verify deletion
      await PhotosRepo.delete(photo.id);
      const afterDel = await PhotosRepo.getById(photo.id);
      expect(afterDel).toBeUndefined();
    });

    it('rejects non-image MIME types gracefully', async () => {
      const textBlob = new Blob(['hello world'], { type: 'text/plain' });
      await expect(
        PhotosRepo.create({
          date: '2026-10-24',
          category: 'Front',
          blob: textBlob,
          mimeType: 'text/plain',
          fileSize: textBlob.size,
        })
      ).rejects.toThrow(/Unsupported image type/);
    });
  });

  // ========================================================
  // 4. FULL JSON EXPORT AND RESTORE (ROUND-TRIP INTEGRITY)
  // ========================================================
  describe('Gate 4: Backup Export & Restore Engine', () => {
    it('exports all tables including Base64 photos, wipes DB, and restores with 100% fidelity', async () => {
      // 1. Seed sample data across tables
      await SettingsRepo.update({
        unitSystem: 'imperial',
        currentArcName: 'DEMON BACK RECONSTRUCTION',
      });

      await MeasurementsRepo.create({
        date: '2026-10-20',
        unit: 'cm',
        bodyweightKg: 85.0,
        standardMetrics: { chest: 112 },
        customMetrics: {},
      });

      await ExercisesRepo.create({
        name: 'Zercher Squat',
        category: 'weighted',
        primaryMuscle: 'Upper Back & Quads',
        isCustom: true,
      });

      await WorkoutsRepo.create({
        date: '2026-10-22',
        title: 'Heavy Back Day',
        exercises: [],
      });

      const photoData = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
      const blob = new Blob([photoData], { type: 'image/jpeg' });
      await PhotosRepo.create({
        date: '2026-10-22',
        category: 'Back',
        blob,
        mimeType: 'image/jpeg',
        fileSize: blob.size,
      });

      await QuestsRepo.create({
        title: 'Shadow Boxing Drills',
        type: 'daily',
        targetValue: 30,
        currentValue: 15,
        unit: 'Minutes',
        completed: false,
      });

      // 2. Export Backup
      const backupEnvelope = await exportSystemBackup();
      expect(backupEnvelope.schemaVersion).toBe(1);
      expect(backupEnvelope.checksum.recordCounts.measurements).toBe(1);
      expect(backupEnvelope.checksum.recordCounts.photos).toBe(1);
      expect(backupEnvelope.data.photos[0].base64Data).toBeDefined();

      // 3. Wipe Database
      await Promise.all([
        db.settings.clear(),
        db.measurements.clear(),
        db.exercises.clear(),
        db.workouts.clear(),
        db.photos.clear(),
        db.quests.clear(),
      ]);

      expect(await db.measurements.count()).toBe(0);
      expect(await db.photos.count()).toBe(0);

      // 4. Restore Backup
      const restoreResult = await restoreSystemBackup(backupEnvelope, 'replace');
      expect(restoreResult.success).toBe(true);

      // 5. Verify restored state
      const restoredSettings = await SettingsRepo.get();
      expect(restoredSettings.unitSystem).toBe('imperial');
      expect(restoredSettings.currentArcName).toBe('DEMON BACK RECONSTRUCTION');

      const restoredMeasurements = await MeasurementsRepo.getAll();
      expect(restoredMeasurements.length).toBe(1);
      expect(restoredMeasurements[0].bodyweightKg).toBe(85.0);

      const restoredPhotos = await PhotosRepo.getAll();
      expect(restoredPhotos.length).toBe(1);
      expect(restoredPhotos[0].blob).toBeInstanceOf(Blob);
      expect(restoredPhotos[0].blob.size).toBe(photoData.length);
    });
  });

  // ========================================================
  // 5. CORRUPTED BACKUP REJECTION
  // ========================================================
  describe('Gate 5: Corrupted Backup Protection', () => {
    it('safely rejects invalid or corrupted backup payloads without altering existing database records', async () => {
      // Seed existing measurement
      await MeasurementsRepo.create({
        date: '2026-10-01',
        unit: 'cm',
        bodyweightKg: 80.0,
        standardMetrics: { chest: 100 },
        customMetrics: {},
      });

      const countBefore = await db.measurements.count();
      expect(countBefore).toBe(1);

      // Corrupted JSON: missing data array
      const corruptedJson = JSON.stringify({
        schemaVersion: 1,
        exportedAt: '2026-10-24T00:00:00Z',
        data: {
          settings: [],
          measurements: 'INVALID_NOT_AN_ARRAY',
        },
      });

      const validation = validateBackupJson(corruptedJson);
      expect(validation.isValid).toBe(false);
      expect(validation.errorMessage).toContain('Corrupted data');

      // Attempt restore should throw
      await expect(restoreSystemBackup(corruptedJson, 'replace')).rejects.toThrow();

      // Existing records MUST remain completely untouched
      const countAfter = await db.measurements.count();
      expect(countAfter).toBe(1);
    });
  });
});
