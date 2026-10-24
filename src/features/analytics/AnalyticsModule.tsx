import React, { useState } from 'react';
import {
  WorkoutSession,
  MeasurementEntry,
  ExerciseDefinition,
  StandardMetricKey,
  STANDARD_METRIC_LABELS,
  UserSettings,
} from '../../domain/types';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { TrendChart, TrendDataPoint } from '../../components/ui/TrendChart';
import { FrequencyChart } from '../../components/ui/FrequencyChart';
import { MetricBadge } from '../../components/ui/MetricBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Trophy,
  Activity,
  Flame,
  Calendar,
} from 'lucide-react';

interface AnalyticsModuleProps {
  workouts: WorkoutSession[];
  measurements: MeasurementEntry[];
  exercises: ExerciseDefinition[];
  settings: UserSettings | null;
}

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  workouts,
  measurements,
  exercises,
  settings,
}) => {
  // Exercise progression selector
  const availableExerciseIds = Array.from(
    new Set(
      workouts.flatMap((w) => w.exercises.map((e) => e.exerciseId))
    )
  );
  const [selectedExId, setSelectedExId] = useState<string>(
    availableExerciseIds[0] || (exercises[0]?.id ?? '')
  );
  const [progressionType, setProgressionType] = useState<'top_weight' | 'session_volume'>(
    'top_weight'
  );

  // Biometric trajectory selector
  const [selectedBioSite, setSelectedBioSite] = useState<StandardMetricKey | 'bodyweight'>('chest');

  // Compute Exercise Progression Trend Data
  const exerciseTrendData: TrendDataPoint[] = [];
  const selectedExDef = exercises.find((e) => e.id === selectedExId);

  // Sort workouts chronologically
  const chronoWorkouts = [...workouts].sort((a, b) => a.date.localeCompare(b.date));

  for (const session of chronoWorkouts) {
    const matchingLog = session.exercises.find((e) => e.exerciseId === selectedExId);
    if (!matchingLog || matchingLog.sets.length === 0) continue;

    if (progressionType === 'top_weight') {
      if (matchingLog.category === 'weighted') {
        const topWeight = Math.max(...matchingLog.sets.map((s) => s.weight || 0));
        if (topWeight > 0) {
          exerciseTrendData.push({ date: session.date, value: topWeight });
        }
      } else if (matchingLog.category === 'bodyweight') {
        const topReps = Math.max(...matchingLog.sets.map((s) => s.reps || 0));
        if (topReps > 0) {
          exerciseTrendData.push({ date: session.date, value: topReps });
        }
      } else if (matchingLog.category === 'timed_track') {
        const topDur = Math.min(...matchingLog.sets.map((s) => s.durationSeconds || Infinity));
        if (topDur < Infinity) {
          exerciseTrendData.push({ date: session.date, value: topDur });
        }
      }
    } else {
      // Session Volume: Sum of (weight * reps)
      const sessionVol = matchingLog.sets.reduce((sum, s) => {
        const w = s.weight || 0;
        const r = s.reps || 0;
        return sum + w * r;
      }, 0);
      if (sessionVol > 0) {
        exerciseTrendData.push({ date: session.date, value: sessionVol });
      }
    }
  }

  // Compute Biometric Trajectory Data
  const biometricTrendData: TrendDataPoint[] = [];
  const chronoMeasurements = [...measurements].sort((a, b) => a.date.localeCompare(b.date));

  for (const m of chronoMeasurements) {
    if (selectedBioSite === 'bodyweight') {
      if (m.bodyweightKg !== undefined) {
        const val =
          settings?.unitSystem === 'imperial'
            ? m.bodyweightKg * 2.20462
            : m.bodyweightKg;
        biometricTrendData.push({ date: m.date, value: Number(val.toFixed(1)) });
      }
    } else {
      const val = m.standardMetrics[selectedBioSite];
      if (val !== undefined) {
        biometricTrendData.push({ date: m.date, value: val });
      }
    }
  }

  // Personal Records Hall of Fame calculation
  interface HallOfFameEntry {
    exerciseId: string;
    exerciseName: string;
    category: string;
    recordDisplay: string;
    rawType: 'RAW MEASUREMENT' | 'DERIVED METRIC';
    dateAchieved: string;
  }

  const hallOfFame: HallOfFameEntry[] = [];
  const exGrouped: Record<string, { name: string; category: string; sets: Array<{ set: any; date: string }> }> = {};

  for (const session of workouts) {
    for (const ex of session.exercises) {
      if (!exGrouped[ex.exerciseId]) {
        exGrouped[ex.exerciseId] = {
          name: ex.exerciseName,
          category: ex.category,
          sets: [],
        };
      }
      for (const s of ex.sets) {
        exGrouped[ex.exerciseId].sets.push({ set: s, date: session.date });
      }
    }
  }

  for (const [exId, data] of Object.entries(exGrouped)) {
    if (data.category === 'weighted') {
      // Find set with highest weight
      let bestWeight = 0;
      let bestReps = 0;
      let bestUnit = 'kg';
      let bestDate = '';

      for (const item of data.sets) {
        const w = item.set.weight || 0;
        if (w > bestWeight) {
          bestWeight = w;
          bestReps = item.set.reps || 1;
          bestUnit = item.set.weightUnit || 'kg';
          bestDate = item.date;
        } else if (w === bestWeight && (item.set.reps || 0) > bestReps) {
          bestReps = item.set.reps || 1;
          bestDate = item.date;
        }
      }

      if (bestWeight > 0) {
        hallOfFame.push({
          exerciseId: exId,
          exerciseName: data.name,
          category: data.category,
          recordDisplay: `${bestWeight} ${bestUnit} x ${bestReps} reps`,
          rawType: 'RAW MEASUREMENT',
          dateAchieved: bestDate,
        });
      }
    } else if (data.category === 'bodyweight') {
      let maxReps = 0;
      let bestAdded = 0;
      let bestDate = '';

      for (const item of data.sets) {
        const r = item.set.reps || 0;
        const added = item.set.addedWeight || 0;
        if (added > bestAdded) {
          bestAdded = added;
          maxReps = r;
          bestDate = item.date;
        } else if (added === bestAdded && r > maxReps) {
          maxReps = r;
          bestDate = item.date;
        }
      }

      if (maxReps > 0 || bestAdded > 0) {
        hallOfFame.push({
          exerciseId: exId,
          exerciseName: data.name,
          category: data.category,
          recordDisplay: bestAdded > 0 ? `+${bestAdded}kg x ${maxReps} reps` : `${maxReps} strict reps`,
          rawType: 'RAW MEASUREMENT',
          dateAchieved: bestDate,
        });
      }
    } else if (data.category === 'timed_track') {
      let fastestSec = Infinity;
      let dist = 0;
      let bestDate = '';

      for (const item of data.sets) {
        const d = item.set.durationSeconds || Infinity;
        if (d < fastestSec) {
          fastestSec = d;
          dist = item.set.distanceMeters || 0;
          bestDate = item.date;
        }
      }

      if (fastestSec < Infinity) {
        hallOfFame.push({
          exerciseId: exId,
          exerciseName: data.name,
          category: data.category,
          recordDisplay: `${fastestSec}s ${dist > 0 ? `(${dist}m)` : ''}`,
          rawType: 'RAW MEASUREMENT',
          dateAchieved: bestDate,
        });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE E // OBJECTIVE PERFORMANCE ANALYTICS
            </h2>
            <MetricBadge label="AYANOKOJI SPEC" variant="slate" />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Zero-speculation analytical telemetry, progression curves & verified records hall of fame.
          </p>
        </div>
      </div>

      {/* TOP SECTION: 2 PRIMARY CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Exercise Progression Curve */}
        <CornerPanel
          variant="crimson"
          title="Exercise Progression Telemetry"
          subtitle="Top set load & session volume progression"
          icon={Flame}
          action={
            <div className="flex items-center gap-2">
              <select
                value={selectedExId}
                onChange={(e) => setSelectedExId(e.target.value)}
                className="bg-obsidian-void border border-tactical-border text-xs font-mono text-combat-crimson px-2 py-1 rounded-sm focus:outline-none"
              >
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name}
                  </option>
                ))}
              </select>

              <select
                value={progressionType}
                onChange={(e) =>
                  setProgressionType(e.target.value as 'top_weight' | 'session_volume')
                }
                className="bg-obsidian-void border border-tactical-border text-xs font-mono text-ayanokoji-secondary px-2 py-1 rounded-sm focus:outline-none"
              >
                <option value="top_weight">Top Load / Reps</option>
                <option value="session_volume">Volume (Weight x Reps)</option>
              </select>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-display font-semibold text-xs text-white">
                  {selectedExDef?.name || 'Selected Drill'}
                </span>
                <MetricBadge
                  label={
                    progressionType === 'top_weight'
                      ? 'RAW MEASUREMENT'
                      : 'DERIVED METRIC'
                  }
                  variant={progressionType === 'top_weight' ? 'blue' : 'amber'}
                  size="sm"
                />
              </div>
              <span className="text-[11px] font-mono text-ayanokoji-muted">
                {exerciseTrendData.length} Data Points
              </span>
            </div>

            <TrendChart
              data={exerciseTrendData}
              unit={
                progressionType === 'session_volume'
                  ? 'vol-kg'
                  : selectedExDef?.category === 'weighted'
                  ? 'kg'
                  : selectedExDef?.category === 'bodyweight'
                  ? 'reps'
                  : 'sec'
              }
              color="crimson"
              height={220}
              emptyMessage={`No logged sessions found for ${selectedExDef?.name || 'this drill'}.`}
            />
          </div>
        </CornerPanel>

        {/* Chart 2: Weekly Training Frequency Histogram */}
        <CornerPanel
          variant="blue"
          title="Conditioning Frequency Consistency"
          subtitle="4-week tactical schedule adherence"
          icon={Calendar}
        >
          <FrequencyChart workouts={workouts} weeksCount={4} />
        </CornerPanel>
      </div>

      {/* SECOND SECTION: BIOMETRIC TRAJECTORY & HALL OF FAME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Biometric Trajectory */}
        <CornerPanel
          variant="blue"
          title="Biometric Trajectory Curve"
          subtitle="Chronological body perimeter development"
          icon={Activity}
          action={
            <select
              value={selectedBioSite}
              onChange={(e) =>
                setSelectedBioSite(e.target.value as StandardMetricKey | 'bodyweight')
              }
              className="bg-obsidian-void border border-tactical-border text-xs font-mono text-solo-blue px-2 py-1 rounded-sm focus:outline-none"
            >
              <option value="bodyweight">Bodyweight</option>
              {Object.entries(STANDARD_METRIC_LABELS).map(([k, lbl]) => (
                <option key={k} value={k}>
                  {lbl}
                </option>
              ))}
            </select>
          }
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-display font-semibold text-xs text-white">
                {selectedBioSite === 'bodyweight'
                  ? 'Bodyweight Mass'
                  : STANDARD_METRIC_LABELS[selectedBioSite as StandardMetricKey]}
              </span>
              <MetricBadge label="RAW MEASUREMENT" variant="blue" size="sm" />
            </div>

            <TrendChart
              data={biometricTrendData}
              unit={
                selectedBioSite === 'bodyweight'
                  ? settings?.unitSystem === 'imperial'
                    ? 'lb'
                    : 'kg'
                  : measurements[0]?.unit || 'cm'
              }
              color="blue"
              height={220}
              emptyMessage="No biometric entries logged for this site."
            />
          </div>
        </CornerPanel>

        {/* Personal Records Hall of Fame */}
        <CornerPanel
          variant="crimson"
          title="Personal Records Hall of Fame"
          subtitle="All-time verified peak accomplishments"
          icon={Trophy}
        >
          {hallOfFame.length > 0 ? (
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {hallOfFame.map((entry) => (
                <div
                  key={entry.exerciseId}
                  className="p-3 bg-obsidian-void border border-combat-crimson/30 rounded-sm flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <div className="font-display font-bold text-white text-xs">
                      {entry.exerciseName}
                    </div>
                    <div className="text-[10px] text-ayanokoji-muted mt-0.5">
                      Verified on {entry.dateAchieved} • {entry.category}
                    </div>
                  </div>

                  <div className="text-right space-y-1">
                    <div className="font-bold text-combat-crimson text-xs tabular-nums">
                      {entry.recordDisplay}
                    </div>
                    <MetricBadge
                      label={entry.rawType}
                      variant={entry.rawType === 'RAW MEASUREMENT' ? 'blue' : 'amber'}
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="ZERO PERSONAL RECORDS"
              description="Personal records are computed automatically as training sessions are entered."
            />
          )}
        </CornerPanel>
      </div>
    </div>
  );
};
