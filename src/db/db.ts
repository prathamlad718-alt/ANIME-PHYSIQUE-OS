import Dexie, { type Table } from 'dexie';
import {
  UserSettings,
  MeasurementEntry,
  ExerciseDefinition,
  WorkoutSession,
  ProgressPhoto,
  QuestItem,
} from '../domain/types';

export class AnimePhysiqueDB extends Dexie {
  settings!: Table<UserSettings, string>;
  measurements!: Table<MeasurementEntry, string>;
  exercises!: Table<ExerciseDefinition, string>;
  workouts!: Table<WorkoutSession, string>;
  photos!: Table<ProgressPhoto, string>;
  quests!: Table<QuestItem, string>;

  constructor() {
    super('AnimePhysiqueOS_DB');

    this.version(1).stores({
      settings: 'id',
      measurements: 'id, date, createdAt, updatedAt',
      exercises: 'id, name, category, primaryMuscle, isCustom',
      workouts: 'id, date, createdAt, updatedAt',
      photos: 'id, date, category, createdAt',
      quests: 'id, type, completed, createdAt',
    });
  }
}

export const db = new AnimePhysiqueDB();

export const DEFAULT_EXERCISES: ExerciseDefinition[] = [
  {
    id: 'ex-squat',
    name: 'Barbell Back Squat',
    category: 'weighted',
    primaryMuscle: 'Quads & Glutes',
    isCustom: false,
  },
  {
    id: 'ex-bench',
    name: 'Flat Barbell Bench Press',
    category: 'weighted',
    primaryMuscle: 'Chest & Triceps',
    isCustom: false,
  },
  {
    id: 'ex-deadlift',
    name: 'Conventional Deadlift',
    category: 'weighted',
    primaryMuscle: 'Posterior Chain',
    isCustom: false,
  },
  {
    id: 'ex-ohp',
    name: 'Overhead Barbell Press',
    category: 'weighted',
    primaryMuscle: 'Deltoids',
    isCustom: false,
  },
  {
    id: 'ex-lat-raise',
    name: 'Dumbbell Lateral Raise',
    category: 'weighted',
    primaryMuscle: 'Lateral Deltoids',
    isCustom: false,
  },
  {
    id: 'ex-leg-press',
    name: 'Incline Leg Press',
    category: 'weighted',
    primaryMuscle: 'Quads',
    isCustom: false,
  },
  {
    id: 'ex-pullup',
    name: 'Strict Pull-Up',
    category: 'bodyweight',
    primaryMuscle: 'Lats & Biceps',
    isCustom: false,
  },
  {
    id: 'ex-muscleup',
    name: 'Parallel Bar Muscle-Up',
    category: 'bodyweight',
    primaryMuscle: 'Upper Body Explosiveness',
    isCustom: false,
  },
  {
    id: 'ex-pushup',
    name: 'Floor Push-Up',
    category: 'bodyweight',
    primaryMuscle: 'Chest & Core',
    isCustom: false,
  },
  {
    id: 'ex-dips',
    name: 'Parallel Bar Dips',
    category: 'bodyweight',
    primaryMuscle: 'Triceps & Lower Chest',
    isCustom: false,
  },
  {
    id: 'ex-sprint',
    name: 'Track Sprints / Speed Laps',
    category: 'timed_track',
    primaryMuscle: 'Cardiovascular & Glycolytic',
    isCustom: false,
  },
  {
    id: 'ex-run',
    name: 'Endurance Track Run',
    category: 'timed_track',
    primaryMuscle: 'Aerobic Threshold',
    isCustom: false,
  },
];

export const DEFAULT_QUESTS: QuestItem[] = [
  {
    id: 'quest-daily-hydration',
    title: 'Hydration Target (3.5L Water)',
    type: 'daily',
    targetValue: 3.5,
    currentValue: 0,
    unit: 'Liters',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-daily-session',
    title: 'Execute Tactical Physical Conditioning',
    type: 'daily',
    targetValue: 1,
    currentValue: 0,
    unit: 'Session',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-daily-mobility',
    title: 'Biomechanical Mobility & Stretches',
    type: 'daily',
    targetValue: 15,
    currentValue: 0,
    unit: 'Minutes',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-weekly-sessions',
    title: 'Record 4 Training Sessions',
    type: 'weekly',
    targetValue: 4,
    currentValue: 0,
    unit: 'Sessions',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-weekly-measurements',
    title: 'Log Biometric Perimeter Check',
    type: 'weekly',
    targetValue: 1,
    currentValue: 0,
    unit: 'Biometric Log',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-milestone-level10',
    title: 'Reach Hunter Level 10 (2,000 XP)',
    type: 'milestone',
    targetValue: 10,
    currentValue: 1,
    unit: 'Level',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'quest-milestone-pullups',
    title: 'Mastery: 20 Strict Bodyweight Pull-Ups',
    type: 'milestone',
    targetValue: 20,
    currentValue: 0,
    unit: 'Reps',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export async function initializeDatabase(): Promise<void> {
  const existingSettings = await db.settings.get('system-config');
  if (!existingSettings) {
    const todayStr = new Date().toISOString().slice(0, 10);
    const defaultSettings: UserSettings = {
      id: 'system-config',
      unitSystem: 'metric',
      journeyStartDate: todayStr,
      currentArcName: 'FOUNDATION ARC',
      reducedMotion: false,
      schemaVersion: 1,
    };
    await db.settings.put(defaultSettings);
  }

  const exCount = await db.exercises.count();
  if (exCount === 0) {
    await db.exercises.bulkPut(DEFAULT_EXERCISES);
  }

  const questCount = await db.quests.count();
  if (questCount === 0) {
    await db.quests.bulkPut(DEFAULT_QUESTS);
  }
}
