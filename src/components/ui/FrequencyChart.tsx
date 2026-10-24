import React from 'react';
import { WorkoutSession } from '../../domain/types';

interface FrequencyChartProps {
  workouts: WorkoutSession[];
  weeksCount?: number;
}

export const FrequencyChart: React.FC<FrequencyChartProps> = ({
  workouts,
  weeksCount = 4,
}) => {
  // Generate the last N weeks
  const today = new Date();
  const dayOfWeek = (today.getDay() + 6) % 7; // Monday = 0, Sunday = 6

  // Array of 7 days for the past 7 days breakdown
  const past7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(today.getDate() - (6 - i));
    const isoDate = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayWorkouts = workouts.filter((w) => w.date === isoDate);
    const hasWorkout = dayWorkouts.some((w) => !w.isRecoveryDay);
    const hasRecovery = dayWorkouts.some((w) => !!w.isRecoveryDay);
    return {
      date: isoDate,
      dayName,
      hasWorkout,
      hasRecovery,
      count: dayWorkouts.length,
    };
  });

  // Calculate 4 weekly totals
  const weekBuckets = Array.from({ length: weeksCount }).map((_, i) => {
    const weekIndex = weeksCount - 1 - i;
    const startOffset = weekIndex * 7 + dayOfWeek;
    const endOffset = startOffset - 6;

    const start = new Date(today);
    start.setDate(today.getDate() - startOffset);
    const end = new Date(today);
    end.setDate(today.getDate() - Math.max(0, endOffset));

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const count = workouts.filter((w) => w.date >= startStr && w.date <= endStr).length;

    return {
      label: `W-${weekIndex + 1}`,
      dateRange: `${startStr.slice(5)} ~ ${endStr.slice(5)}`,
      count,
    };
  }).reverse();

  const maxWeeklyCount = Math.max(4, ...weekBuckets.map((b) => b.count));

  return (
    <div className="space-y-4">
      {/* 7-Day Micro Strip */}
      <div>
        <div className="text-[11px] font-mono text-ayanokoji-muted mb-2 uppercase tracking-wider">
          Last 7 Days Activity
        </div>
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {past7Days.map((d) => (
            <div
              key={d.date}
              className={`p-2 border rounded-sm flex flex-col items-center justify-center transition-colors ${
                d.hasWorkout
                  ? 'border-combat-crimson bg-combat-crimson/15 text-combat-crimson shadow-hud-crimson'
                  : d.hasRecovery
                  ? 'border-solo-blue bg-solo-blue/15 text-solo-blue'
                  : 'border-tactical-border/70 bg-obsidian-charcoal/40 text-ayanokoji-muted'
              }`}
            >
              <span className="text-[10px] font-mono">{d.dayName}</span>
              <span className="text-[9px] font-mono opacity-70">{d.date.slice(8)}</span>
              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            </div>
          ))}
        </div>
      </div>

      {/* 4-Week Volume Histogram */}
      <div>
        <div className="text-[11px] font-mono text-ayanokoji-muted mb-2 uppercase tracking-wider">
          Weekly Frequency (Past 4 Weeks)
        </div>
        <div className="space-y-2">
          {weekBuckets.map((bucket) => {
            const widthPct = Math.round((bucket.count / maxWeeklyCount) * 100);
            return (
              <div key={bucket.label} className="space-y-1">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-ayanokoji-secondary">
                    {bucket.label} <span className="text-[10px] text-ayanokoji-muted">({bucket.dateRange})</span>
                  </span>
                  <span className="text-ayanokoji-slate font-semibold tabular-nums">
                    {bucket.count} {bucket.count === 1 ? 'SESSION' : 'SESSIONS'}
                  </span>
                </div>
                <div className="h-2 w-full bg-obsidian-elevated border border-tactical-border rounded-sm overflow-hidden">
                  <div
                    className="h-full bg-solo-blue transition-all duration-300"
                    style={{ width: `${Math.max(4, widthPct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
