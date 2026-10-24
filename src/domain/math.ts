import {
  MeasurementEntry,
  WorkoutSession,
  QuestItem,
  SystemRankInfo,
  ExerciseSet,
} from './types';

// ==========================================
// UNIT CONVERSION MATHEMATICS
// ==========================================

export const CM_PER_INCH = 2.54;
export const LBS_PER_KG = 2.20462262;

export function cmToInches(cm: number): number {
  return Number((cm / CM_PER_INCH).toFixed(2));
}

export function inchesToCm(inches: number): number {
  return Number((inches * CM_PER_INCH).toFixed(2));
}

export function kgToLbs(kg: number): number {
  return Number((kg * LBS_PER_KG).toFixed(2));
}

export function lbsToKg(lbs: number): number {
  return Number((lbs / LBS_PER_KG).toFixed(2));
}

export function formatWeight(val: number | undefined, targetUnit: 'kg' | 'lb'): string {
  if (val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(1)} ${targetUnit}`;
}

export function formatMeasurement(val: number | undefined, targetUnit: 'cm' | 'in'): string {
  if (val === undefined || isNaN(val)) return '—';
  return `${val.toFixed(1)} ${targetUnit}`;
}

// ==========================================
// VALIDATION LOGIC
// ==========================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function validateMeasurementValue(value: number, unit: 'cm' | 'in'): string | null {
  if (isNaN(value)) return 'Value must be a valid number';
  if (value <= 0) return 'Value must be greater than zero';

  const cmVal = unit === 'in' ? inchesToCm(value) : value;
  if (cmVal < 5) return 'Measurement cannot be less than 5 cm (approx 2 in)';
  if (cmVal > 300) return 'Measurement cannot exceed 300 cm (approx 118 in)';
  return null;
}

export function validateBodyweight(value: number, unit: 'kg' | 'lb'): string | null {
  if (isNaN(value)) return 'Bodyweight must be a valid number';
  if (value <= 0) return 'Bodyweight must be greater than zero';

  const kgVal = unit === 'lb' ? lbsToKg(value) : value;
  if (kgVal < 20) return 'Bodyweight cannot be under 20 kg (44 lb)';
  if (kgVal > 500) return 'Bodyweight cannot exceed 500 kg (1100 lb)';
  return null;
}

export function validateMeasurementEntry(entry: Partial<MeasurementEntry>): ValidationResult {
  const errors: Record<string, string> = {};

  if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    errors.date = 'Valid date (YYYY-MM-DD) is required';
  }

  const unit = entry.unit || 'cm';

  if (entry.bodyweightKg !== undefined && entry.bodyweightKg !== null) {
    const err = validateBodyweight(entry.bodyweightKg, 'kg');
    if (err) errors.bodyweightKg = err;
  }

  if (entry.standardMetrics) {
    for (const [key, val] of Object.entries(entry.standardMetrics)) {
      if (val !== undefined && val !== null) {
        const err = validateMeasurementValue(val, unit);
        if (err) errors[`standardMetrics.${key}`] = err;
      }
    }
  }

  if (entry.customMetrics) {
    for (const [key, val] of Object.entries(entry.customMetrics)) {
      if (val !== undefined && val !== null) {
        const err = validateMeasurementValue(val, unit);
        if (err) errors[`customMetrics.${key}`] = err;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

// ==========================================
// PR CALCULATION & DETECTION
// ==========================================

export interface ExercisePRRecord {
  exerciseId: string;
  exerciseName: string;
  category: 'weighted' | 'bodyweight' | 'timed_track';
  maxWeightKg?: number;
  maxReps?: number;
  bestDurationSeconds?: number;
  maxDistanceMeters?: number;
  achievedDate: string;
}

/**
 * Evaluates whether a set qualifies as a Personal Record (PR) against historical sets.
 * Compares strictly against identical category and normalized units.
 */
export function isSetAPersonalRecord(
  targetSet: ExerciseSet,
  exerciseId: string,
  category: 'weighted' | 'bodyweight' | 'timed_track',
  historicalSessions: WorkoutSession[],
  currentSessionId?: string
): boolean {
  // Collect all historical sets for this exercise excluding current session
  const priorSets: ExerciseSet[] = [];
  for (const session of historicalSessions) {
    if (currentSessionId && session.id === currentSessionId) continue;
    for (const ex of session.exercises) {
      if (ex.exerciseId === exerciseId && ex.category === category) {
        priorSets.push(...ex.sets);
      }
    }
  }

  if (priorSets.length === 0) {
    // If it's a valid completed set, first time is a benchmark/PR
    if (category === 'weighted' && (targetSet.weight || 0) > 0 && (targetSet.reps || 0) > 0) return true;
    if (category === 'bodyweight' && (targetSet.reps || 0) > 0) return true;
    if (category === 'timed_track' && (targetSet.durationSeconds || 0) > 0) return true;
    return false;
  }

  if (category === 'weighted') {
    const targetNormalizedWeight = targetSet.weightUnit === 'lb'
      ? lbsToKg(targetSet.weight || 0)
      : (targetSet.weight || 0);
    const targetReps = targetSet.reps || 0;
    if (targetNormalizedWeight <= 0 || targetReps <= 0) return false;

    // A PR is achieved if weight exceeds any prior set, OR same weight with more reps
    const maxPriorWeight = Math.max(
      ...priorSets.map((s) => (s.weightUnit === 'lb' ? lbsToKg(s.weight || 0) : (s.weight || 0)))
    );
    if (targetNormalizedWeight > maxPriorWeight + 0.01) return true;

    // Check reps at or above target weight
    const setsAtOrAboveWeight = priorSets.filter((s) => {
      const w = s.weightUnit === 'lb' ? lbsToKg(s.weight || 0) : (s.weight || 0);
      return w >= targetNormalizedWeight - 0.01;
    });
    const maxPriorRepsAtWeight = setsAtOrAboveWeight.reduce(
      (max, s) => Math.max(max, s.reps || 0),
      0
    );
    return targetReps > maxPriorRepsAtWeight;
  }

  if (category === 'bodyweight') {
    const targetReps = targetSet.reps || 0;
    const targetAdded = targetSet.addedWeight || 0;
    if (targetReps <= 0) return false;

    // Check if added weight is higher
    const maxPriorAdded = Math.max(...priorSets.map((s) => s.addedWeight || 0));
    if (targetAdded > maxPriorAdded + 0.01 && targetReps >= 1) return true;

    // Max reps for same or greater added weight
    const setsWithEqualOrGreaterAdded = priorSets.filter((s) => (s.addedWeight || 0) >= targetAdded - 0.01);
    const maxPriorReps = setsWithEqualOrGreaterAdded.reduce((max, s) => Math.max(max, s.reps || 0), 0);
    return targetReps > maxPriorReps;
  }

  if (category === 'timed_track') {
    const targetDist = targetSet.distanceMeters || 0;
    const targetDur = targetSet.durationSeconds || 0;
    if (targetDur <= 0) return false;

    if (targetDist > 0) {
      // Find same or greater distance
      const matchingDistSets = priorSets.filter((s) => (s.distanceMeters || 0) >= targetDist);
      if (matchingDistSets.length === 0) return true;
      const fastestDuration = Math.min(
        ...matchingDistSets.map((s) => s.durationSeconds || Infinity)
      );
      return targetDur < fastestDuration;
    }
  }

  return false;
}

// ==========================================
// XP & SYSTEM RANK LEDGER
// ==========================================

export const XP_RULES = {
  PER_WORKOUT: 100,
  PER_QUEST_COMPLETED: 25,
  PER_MEASUREMENT_LOG: 50,
  PER_RECOVERY_DAY: 40,
} as const;

export function calculateSystemXP(
  workouts: WorkoutSession[],
  quests: QuestItem[],
  measurements: MeasurementEntry[]
): SystemRankInfo {
  const regularWorkouts = workouts.filter((w) => !w.isRecoveryDay);
  const recoveryDays = workouts.filter((w) => !!w.isRecoveryDay);
  const completedQuests = quests.filter((q) => q.completed);

  const workoutXP = regularWorkouts.length * XP_RULES.PER_WORKOUT;
  const recoveryXP = recoveryDays.length * XP_RULES.PER_RECOVERY_DAY;
  const questXP = completedQuests.length * XP_RULES.PER_QUEST_COMPLETED;
  const measurementXP = measurements.length * XP_RULES.PER_MEASUREMENT_LOG;

  const totalXP = workoutXP + recoveryXP + questXP + measurementXP;

  // Rank thresholds
  let rank: SystemRankInfo['rank'] = 'E';
  let title = 'NOVICE AWAKENED';
  let rankFloorXP = 0;
  let nextRankXP = 500;

  if (totalXP >= 20000) {
    rank = 'MONARCH';
    title = 'SHADOW SOVEREIGN / APEX OGRE';
    rankFloorXP = 20000;
    nextRankXP = 30000;
  } else if (totalXP >= 12000) {
    rank = 'S';
    title = 'SHADOW ELITE';
    rankFloorXP = 12000;
    nextRankXP = 20000;
  } else if (totalXP >= 7000) {
    rank = 'A';
    title = 'TACTICAL MASTER';
    rankFloorXP = 7000;
    nextRankXP = 12000;
  } else if (totalXP >= 3500) {
    rank = 'B';
    title = 'COMBAT SPECIALIST';
    rankFloorXP = 3500;
    nextRankXP = 7000;
  } else if (totalXP >= 1500) {
    rank = 'C';
    title = 'DISCIPLINE OPERATIVE';
    rankFloorXP = 1500;
    nextRankXP = 3500;
  } else if (totalXP >= 500) {
    rank = 'D';
    title = 'CONDITIONED HUNTER';
    rankFloorXP = 500;
    nextRankXP = 1500;
  }

  const range = nextRankXP - rankFloorXP;
  const progressInRank = Math.max(0, totalXP - rankFloorXP);
  const progressPercent = Math.min(100, Math.floor((progressInRank / range) * 100));
  const level = Math.floor(totalXP / 200) + 1;

  return {
    rank,
    title,
    currentXP: totalXP,
    nextRankXP,
    progressPercent,
    level,
    totalWorkouts: workouts.length,
    totalQuestsCompleted: completedQuests.length,
    totalMeasurements: measurements.length,
  };
}

// ==========================================
// DATE & CONSISTENCY HELPERS
// ==========================================

export function calculateJourneyDayCount(startDateStr: string): number {
  if (!startDateStr) return 1;
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 1;

  const now = new Date();
  // Strip time components to calculate discrete calendar days
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const diffTime = today - startDay;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

export function calculateConsistencyRate(
  workouts: WorkoutSession[],
  days: 7 | 30
): { ratePercent: number; activeDaysCount: number } {
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - days);

  const cutoffStr = cutoffDate.toISOString().slice(0, 10);
  const activeDates = new Set<string>();

  for (const session of workouts) {
    if (session.date >= cutoffStr) {
      activeDates.add(session.date);
    }
  }

  const activeDaysCount = activeDates.size;
  // Consistency rate based on active days out of the window
  const ratePercent = Math.min(100, Math.round((activeDaysCount / days) * 100));
  return { ratePercent, activeDaysCount };
}
