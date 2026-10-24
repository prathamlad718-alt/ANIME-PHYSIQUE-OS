export type UnitSystem = 'metric' | 'imperial';

export interface UserSettings {
  id: 'system-config';
  unitSystem: UnitSystem;
  journeyStartDate: string; // ISO date string e.g. YYYY-MM-DD
  currentArcName: string; // e.g. "FOUNDATION ARC"
  reducedMotion: boolean;
  schemaVersion: 1;
}

export type StandardMetricKey =
  | 'neck'
  | 'shoulders'
  | 'chest'
  | 'leftUpperArm'
  | 'rightUpperArm'
  | 'leftForearm'
  | 'rightForearm'
  | 'waist'
  | 'hips'
  | 'leftThigh'
  | 'rightThigh'
  | 'leftCalf'
  | 'rightCalf';

export const STANDARD_METRIC_LABELS: Record<StandardMetricKey, string> = {
  neck: 'Neck',
  shoulders: 'Shoulders',
  chest: 'Chest',
  leftUpperArm: 'L. Bicep/Arm',
  rightUpperArm: 'R. Bicep/Arm',
  leftForearm: 'L. Forearm',
  rightForearm: 'R. Forearm',
  waist: 'Waist',
  hips: 'Hips / Glutes',
  leftThigh: 'L. Thigh',
  rightThigh: 'R. Thigh',
  leftCalf: 'L. Calf',
  rightCalf: 'R. Calf',
};

export interface MeasurementEntry {
  id: string;
  date: string; // YYYY-MM-DD
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
  unit: 'cm' | 'in';
  bodyweightKg?: number;
  standardMetrics: Partial<Record<StandardMetricKey, number>>;
  customMetrics: Record<string, number>;
  notes?: string;
}

export type ExerciseCategory = 'weighted' | 'bodyweight' | 'timed_track';

export interface ExerciseDefinition {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscle: string;
  isCustom: boolean;
}

export interface ExerciseSet {
  id: string;
  setNumber: number;
  reps?: number;
  weight?: number;
  weightUnit?: 'kg' | 'lb';
  isBodyweight?: boolean;
  addedWeight?: number;
  durationSeconds?: number;
  distanceMeters?: number;
  laps?: number;
  isPR?: boolean;
}

export interface WorkoutExerciseLog {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: ExerciseCategory;
  sets: ExerciseSet[];
}

export interface WorkoutSession {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  durationMinutes?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  exercises: WorkoutExerciseLog[];
  isRecoveryDay?: boolean;
}

export type PhotoCategory =
  | 'Front'
  | 'Side'
  | 'Back'
  | 'Front Double Biceps'
  | string;

export interface ProgressPhoto {
  id: string;
  date: string; // YYYY-MM-DD
  category: PhotoCategory;
  blob: Blob;
  mimeType: string;
  fileSize: number;
  notes?: string;
  createdAt: string;
}

export interface SerializedPhotoRecord {
  id: string;
  date: string;
  category: string;
  base64Data: string;
  mimeType: string;
  fileSize: number;
  notes?: string;
  createdAt: string;
}

export type QuestType = 'daily' | 'weekly' | 'milestone';

export interface QuestItem {
  id: string;
  title: string;
  type: QuestType;
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  lastCompletedDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SystemRankInfo {
  rank: 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'MONARCH';
  title: string;
  currentXP: number;
  nextRankXP: number;
  progressPercent: number;
  level: number;
  totalWorkouts: number;
  totalQuestsCompleted: number;
  totalMeasurements: number;
}

export interface BackupEnvelope {
  schemaVersion: 1;
  exportedAt: string;
  checksum: {
    recordCounts: {
      settings: number;
      measurements: number;
      exercises: number;
      workouts: number;
      photos: number;
      quests: number;
    };
  };
  data: {
    settings: UserSettings[];
    measurements: MeasurementEntry[];
    exercises: ExerciseDefinition[];
    workouts: WorkoutSession[];
    photos: SerializedPhotoRecord[];
    quests: QuestItem[];
  };
}
