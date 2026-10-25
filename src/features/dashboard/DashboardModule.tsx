import React from 'react';
import {
  UserSettings,
  SystemRankInfo,
  WorkoutSession,
  MeasurementEntry,
  QuestItem,
  STANDARD_METRIC_LABELS,
} from '../../domain/types';
import {
  calculateJourneyDayCount,
  calculateConsistencyRate,
  formatMeasurement,
} from '../../domain/math';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { MetricBadge } from '../../components/ui/MetricBadge';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { EmptyState } from '../../components/ui/EmptyState';
import {
  Flame,
  Activity,
  Trophy,
  ShieldCheck,
  Zap,
  Camera,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CheckCircle2,
  Circle,
  Clock,
} from 'lucide-react';
import { NavTabId } from '../../components/layout/DesktopSidebar';

interface DashboardModuleProps {
  settings: UserSettings | null;
  rankInfo: SystemRankInfo;
  workouts: WorkoutSession[];
  measurements: MeasurementEntry[];
  quests: QuestItem[];
  onNavigate: (tab: NavTabId) => void;
  onOpenWorkoutModal: () => void;
  onOpenMeasurementModal: () => void;
  onToggleQuest: (id: string) => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  settings,
  rankInfo,
  workouts,
  measurements,
  quests,
  onNavigate,
  onOpenWorkoutModal,
  onOpenMeasurementModal,
  onToggleQuest,
}) => {
  const dayCount = settings
    ? calculateJourneyDayCount(settings.journeyStartDate)
    : 1;

  const consistency7 = calculateConsistencyRate(workouts, 7);
  const consistency30 = calculateConsistencyRate(workouts, 30);

  // Filter regular workouts vs recovery
  const regularWorkouts = workouts.filter((w) => !w.isRecoveryDay);
  const mostRecentSession = regularWorkouts.length > 0 ? regularWorkouts[0] : null;

  // Extract recent PR sets across all sessions
  const recentPRs: Array<{
    exerciseName: string;
    weight?: number;
    weightUnit?: string;
    reps?: number;
    addedWeight?: number;
    durationSeconds?: number;
    date: string;
  }> = [];

  for (const session of workouts) {
    for (const ex of session.exercises) {
      for (const s of ex.sets) {
        if (s.isPR) {
          recentPRs.push({
            exerciseName: ex.exerciseName,
            weight: s.weight,
            weightUnit: s.weightUnit,
            reps: s.reps,
            addedWeight: s.addedWeight,
            durationSeconds: s.durationSeconds,
            date: session.date,
          });
        }
      }
    }
    if (recentPRs.length >= 4) break;
  }

  // Calculate latest biometric deltas if at least 2 measurement entries exist
  const latestMeasurement = measurements[0];
  const priorMeasurement = measurements[1];

  const dailyQuests = quests.filter((q) => q.type === 'daily');

  return (
    <div className="space-y-6">
      {/* 1. TOP AWAKENING HERO BANNER */}
      <div className="relative border border-solo-blue/50 bg-gradient-to-r from-obsidian-charcoal via-obsidian-elevated to-obsidian-charcoal p-5 sm:p-6 rounded-sm shadow-hud-blue overflow-hidden animate-aura-blue">
        {/* Specular Edge Top Line */}
        <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-solo-blue/40 to-transparent pointer-events-none" />

        {/* Ambient Radial Aura Blobs */}
        <div className="absolute -top-12 -right-12 w-72 h-72 bg-solo-blue/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-12 -left-12 w-72 h-72 bg-combat-crimson/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono tracking-widest text-solo-blue uppercase px-2.5 py-0.5 bg-solo-blue/15 border border-solo-blue/40 rounded-sm font-bold shadow-hud-blue flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-solo-blue animate-ping" />
                SYSTEM ONLINE // HUNTER LINK
              </span>
              <span className="text-xs font-mono text-ayanokoji-muted">
                CODENAME: <span className="text-white font-bold">{settings?.currentArcName || 'FOUNDATION ARC'}</span>
              </span>
            </div>
            <h1 className="font-display font-black text-xl sm:text-3xl text-white tracking-wide uppercase flex items-center gap-3">
              <span>HUNTER STATUS // LEVEL {rankInfo.level}</span>
              <span className="px-2 py-0.5 text-sm font-mono font-bold bg-combat-crimson/20 border border-combat-crimson text-combat-crimson rounded-sm shadow-hud-crimson">
                {rankInfo.rank}-RANK
              </span>
            </h1>
            <p className="text-xs text-ayanokoji-secondary max-w-xl font-mono leading-relaxed">
              Day <span className="text-white font-bold">{dayCount}</span> of continuous physical transformation. Total cumulative activity standing at{' '}
              <span className="text-solo-blue font-bold tabular-nums">{rankInfo.currentXP} XP</span>. Next rank tier unlocks at{' '}
              <span className="text-white font-bold tabular-nums">{rankInfo.nextRankXP} XP</span>.
            </p>
          </div>

          {/* Quick Action Button Cluster */}
          <div className="flex flex-wrap items-center gap-2.5">
            <TacticalButton
              variant="crimson"
              size="md"
              icon={Flame}
              onClick={onOpenWorkoutModal}
            >
              LOG WORKOUT
            </TacticalButton>
            <TacticalButton
              variant="primary"
              size="md"
              icon={Activity}
              onClick={onOpenMeasurementModal}
            >
              RECORD BIOMETRICS
            </TacticalButton>
            <TacticalButton
              variant="secondary"
              size="md"
              icon={Camera}
              onClick={() => onNavigate('photos')}
            >
              VAULT
            </TacticalButton>
          </div>
        </div>

        {/* System XP Progression Meter */}
        <div className="mt-5 pt-4 border-t border-tactical-border/60 relative z-10">
          <div className="flex justify-between items-center text-xs font-mono mb-1.5">
            <span className="text-ayanokoji-secondary font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-solo-blue animate-pulse" />
              ARC PROGRESSION TOWARD {rankInfo.rank === 'MONARCH' ? 'TRANSCENDENCE' : 'NEXT RANK'}
            </span>
            <span className="text-solo-blue font-bold tabular-nums">
              {rankInfo.progressPercent}% COMPLETE
            </span>
          </div>
          <div className="w-full h-2.5 bg-obsidian-void border border-tactical-border rounded-sm overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-solo-blue via-cyan-400 to-solo-blue transition-all duration-500 relative"
              style={{ width: `${Math.max(2, rankInfo.progressPercent)}%` }}
            >
              {/* Leading edge neon spark */}
              <div className="absolute right-0 top-0 bottom-0 w-2 bg-white shadow-[0_0_8px_#ffffff]" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE STAT GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Workouts */}
        <CornerPanel
          variant="blue"
          title="Recorded Sessions"
          icon={Flame}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl font-display font-black text-white tabular-nums">
              {workouts.length}
            </div>
            <div className="text-[11px] font-mono text-ayanokoji-muted mt-1">
              {regularWorkouts.length} Training / {workouts.length - regularWorkouts.length} Recovery
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-tactical-border/40 flex justify-between items-center text-[10px] font-mono">
            <span className="text-ayanokoji-secondary">SYSTEM ENGAGEMENT</span>
            <MetricBadge
              label={workouts.length > 0 ? 'ACTIVE' : 'IDLE'}
              variant={workouts.length > 0 ? 'emerald' : 'slate'}
            />
          </div>
        </CornerPanel>

        {/* Card 2: 7-Day Consistency */}
        <CornerPanel
          variant="blue"
          title="7-Day Consistency"
          icon={Zap}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl font-display font-black text-white tabular-nums">
              {consistency7.ratePercent}%
            </div>
            <div className="text-[11px] font-mono text-ayanokoji-muted mt-1">
              {consistency7.activeDaysCount} of 7 calendar days logged
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-tactical-border/40 flex justify-between items-center text-[10px] font-mono">
            <span className="text-ayanokoji-secondary">30-DAY RATE</span>
            <span className="font-bold text-ayanokoji-slate tabular-nums">
              {consistency30.ratePercent}% ({consistency30.activeDaysCount}d)
            </span>
          </div>
        </CornerPanel>

        {/* Card 3: Latest Bodyweight */}
        <CornerPanel
          variant="blue"
          title="Bodyweight Status"
          icon={Activity}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl font-display font-black text-white tabular-nums">
              {latestMeasurement?.bodyweightKg !== undefined
                ? settings?.unitSystem === 'imperial'
                  ? `${(latestMeasurement.bodyweightKg * 2.20462).toFixed(1)} lb`
                  : `${latestMeasurement.bodyweightKg.toFixed(1)} kg`
                : 'Unrecorded'}
            </div>
            <div className="text-[11px] font-mono text-ayanokoji-muted mt-1">
              {latestMeasurement ? `Logged ${latestMeasurement.date}` : 'No biometric entries yet'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-tactical-border/40 flex justify-between items-center text-[10px] font-mono">
            <span className="text-ayanokoji-secondary">TOTAL SITE LOGS</span>
            <span className="font-bold text-solo-blue tabular-nums">
              {measurements.length}
            </span>
          </div>
        </CornerPanel>

        {/* Card 4: Daily Directives */}
        <CornerPanel
          variant="blue"
          title="Daily Directives"
          icon={ShieldCheck}
          className="flex flex-col justify-between"
        >
          <div>
            <div className="text-3xl font-display font-black text-white tabular-nums">
              {dailyQuests.filter((q) => q.completed).length} / {dailyQuests.length}
            </div>
            <div className="text-[11px] font-mono text-ayanokoji-muted mt-1">
              {dailyQuests.every((q) => q.completed) && dailyQuests.length > 0
                ? 'All objectives satisfied'
                : 'Protocols awaiting execution'}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-tactical-border/40 flex justify-between items-center text-[10px] font-mono">
            <span className="text-ayanokoji-secondary">DIRECTIVES STATUS</span>
            <MetricBadge
              label={dailyQuests.some((q) => !q.completed) ? 'PENDING' : 'COMPLETE'}
              variant={dailyQuests.some((q) => !q.completed) ? 'amber' : 'emerald'}
            />
          </div>
        </CornerPanel>
      </div>

      {/* 3. TWO-COLUMN OPERATIONAL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN: Recent Session & PRs */}
        <div className="space-y-6">
          {/* Most Recent Session */}
          <CornerPanel
            variant="crimson"
            title="Most Recent Session Summary"
            subtitle="Combat & Conditioning Record"
            icon={Flame}
            action={
              <TacticalButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('workouts')}
              >
                VIEW LOGS
              </TacticalButton>
            }
          >
            {mostRecentSession ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-display font-bold text-white text-base">
                      {mostRecentSession.title}
                    </h4>
                    <div className="text-xs font-mono text-ayanokoji-muted flex items-center gap-2 mt-0.5">
                      <span>{mostRecentSession.date}</span>
                      {mostRecentSession.durationMinutes && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {mostRecentSession.durationMinutes} min
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <MetricBadge label="LOGGED" variant="crimson" />
                </div>

                <div className="border border-tactical-border bg-obsidian-void p-3 rounded-sm space-y-2">
                  <div className="text-[10px] font-mono text-ayanokoji-muted uppercase tracking-wider">
                    EXECUTED DRILLS ({mostRecentSession.exercises.length})
                  </div>
                  <div className="space-y-1.5">
                    {mostRecentSession.exercises.slice(0, 3).map((ex) => (
                      <div
                        key={ex.id}
                        className="flex justify-between items-center text-xs font-mono"
                      >
                        <span className="text-ayanokoji-slate">{ex.exerciseName}</span>
                        <span className="text-ayanokoji-muted tabular-nums">
                          {ex.sets.length} sets completed
                        </span>
                      </div>
                    ))}
                    {mostRecentSession.exercises.length > 3 && (
                      <div className="text-[10px] font-mono text-ayanokoji-muted text-right">
                        +{mostRecentSession.exercises.length - 3} more exercises
                      </div>
                    )}
                  </div>
                </div>

                {mostRecentSession.notes && (
                  <p className="text-xs text-ayanokoji-secondary italic font-mono bg-obsidian-elevated/40 p-2 border-l-2 border-combat-crimson">
                    "{mostRecentSession.notes}"
                  </p>
                )}
              </div>
            ) : (
              <EmptyState
                title="NO TRAINING LOGS ON RECORD"
                description="Begin your conditioning journey by registering your initial workout session."
                actionLabel="INITIALIZE WORKOUT"
                onAction={onOpenWorkoutModal}
                actionVariant="crimson"
              />
            )}
          </CornerPanel>

          {/* Recent Verified PRs */}
          <CornerPanel
            variant="crimson"
            title="Recent Verified PRs"
            subtitle="Parametric Peak Accomplishments"
            icon={Trophy}
          >
            {recentPRs.length > 0 ? (
              <div className="space-y-2">
                {recentPRs.map((pr, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-obsidian-void border border-combat-crimson/30 rounded-sm"
                  >
                    <div>
                      <div className="font-display font-bold text-xs text-white">
                        {pr.exerciseName}
                      </div>
                      <div className="text-[10px] font-mono text-ayanokoji-muted">
                        Achieved on {pr.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-xs text-combat-crimson tabular-nums">
                        {pr.weight !== undefined
                          ? `${pr.weight} ${pr.weightUnit || 'kg'} x ${pr.reps || 1} reps`
                          : pr.reps !== undefined
                          ? `${pr.reps} reps`
                          : pr.durationSeconds !== undefined
                          ? `${pr.durationSeconds}s`
                          : 'VERIFIED'}
                      </div>
                      <MetricBadge label="RECORD" variant="crimson" size="sm" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="NO PRS RECORDED YET"
                description="Personal Records are evaluated automatically as you log workouts with valid weights, reps, or times."
              />
            )}
          </CornerPanel>
        </div>

        {/* RIGHT COLUMN: Latest Biometric Deltas & Daily Directives */}
        <div className="space-y-6">
          {/* Latest Biometric Deltas */}
          <CornerPanel
            variant="blue"
            title="Biometric Perimeter Deltas"
            subtitle="Comparison: Latest vs Previous Check"
            icon={Activity}
            action={
              <TacticalButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('measurements')}
              >
                OPEN DELTAS
              </TacticalButton>
            }
          >
            {latestMeasurement && priorMeasurement ? (
              <div className="space-y-3">
                <div className="text-[11px] font-mono text-ayanokoji-muted flex justify-between">
                  <span>Current: {latestMeasurement.date}</span>
                  <span>Previous: {priorMeasurement.date}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STANDARD_METRIC_LABELS).slice(0, 6).map(([key, label]) => {
                    const currentVal = latestMeasurement.standardMetrics[key as keyof typeof latestMeasurement.standardMetrics];
                    const priorVal = priorMeasurement.standardMetrics[key as keyof typeof priorMeasurement.standardMetrics];

                    if (currentVal === undefined && priorVal === undefined) return null;

                    const delta = currentVal !== undefined && priorVal !== undefined
                      ? currentVal - priorVal
                      : null;

                    return (
                      <div
                        key={key}
                        className="p-2.5 bg-obsidian-void border border-tactical-border rounded-sm"
                      >
                        <div className="text-[10px] font-mono text-ayanokoji-muted uppercase truncate">
                          {label}
                        </div>
                        <div className="flex items-center justify-between mt-1 font-mono">
                          <span className="text-xs font-bold text-white tabular-nums">
                            {formatMeasurement(currentVal, latestMeasurement.unit)}
                          </span>
                          {delta !== null ? (
                            <span
                              className={`flex items-center text-xs font-bold tabular-nums ${
                                delta > 0
                                  ? 'text-status-success'
                                  : delta < 0
                                  ? 'text-status-warning'
                                  : 'text-ayanokoji-muted'
                              }`}
                            >
                              {delta > 0 ? (
                                <ArrowUpRight className="w-3 h-3 mr-0.5" />
                              ) : delta < 0 ? (
                                <ArrowDownRight className="w-3 h-3 mr-0.5" />
                              ) : (
                                <Minus className="w-3 h-3 mr-0.5" />
                              )}
                              {delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-[10px] text-ayanokoji-muted font-mono">NEW</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <p className="text-[10px] text-ayanokoji-muted font-mono leading-relaxed bg-obsidian-elevated/40 p-2 border border-tactical-border/60">
                  Analytical notice: Short-term circumference fluctuations reflect fluid retention, glycogen saturation, and measurement tension rather than immediate tissue change.
                </p>
              </div>
            ) : latestMeasurement ? (
              <div className="p-4 bg-obsidian-void border border-tactical-border text-center space-y-2 rounded-sm">
                <MetricBadge label="BASELINE ESTABLISHED" variant="blue" />
                <p className="text-xs font-mono text-ayanokoji-slate">
                  Initial biometric record saved ({latestMeasurement.date}).
                </p>
                <p className="text-[11px] font-mono text-ayanokoji-muted">
                  Record a subsequent measurement to unlock automated perimeter deltas.
                </p>
                <TacticalButton
                  variant="primary"
                  size="sm"
                  onClick={onOpenMeasurementModal}
                >
                  ADD SECOND CHECK
                </TacticalButton>
              </div>
            ) : (
              <EmptyState
                title="NO BIOMETRIC CHECKS"
                description="Zero anatomical measurements on file. Record your physical baseline measurements."
                actionLabel="RECORD BASELINE"
                onAction={onOpenMeasurementModal}
                actionVariant="primary"
              />
            )}
          </CornerPanel>

          {/* Active Daily Directives */}
          <CornerPanel
            variant="blue"
            title="Active Daily Directives"
            subtitle="Mission Quests for Today"
            icon={ShieldCheck}
            action={
              <TacticalButton
                variant="ghost"
                size="sm"
                onClick={() => onNavigate('quests')}
              >
                ALL DIRECTIVES
              </TacticalButton>
            }
          >
            <div className="space-y-2">
              {dailyQuests.map((quest) => (
                <div
                  key={quest.id}
                  onClick={() => onToggleQuest(quest.id)}
                  className={`flex items-center justify-between p-3 border rounded-sm cursor-pointer transition-colors ${
                    quest.completed
                      ? 'border-status-success/40 bg-status-success/5 text-ayanokoji-slate'
                      : 'border-tactical-border bg-obsidian-void hover:border-solo-blue/50 text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {quest.completed ? (
                      <CheckCircle2 className="w-4 h-4 text-status-success shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-ayanokoji-muted shrink-0 hover:text-solo-blue" />
                    )}
                    <div>
                      <span
                        className={`text-xs font-display font-semibold ${
                          quest.completed ? 'line-through text-ayanokoji-muted' : 'text-white'
                        }`}
                      >
                        {quest.title}
                      </span>
                      <div className="text-[10px] font-mono text-ayanokoji-muted">
                        Target: {quest.targetValue} {quest.unit}
                      </div>
                    </div>
                  </div>
                  <MetricBadge
                    label={quest.completed ? 'FULFILLED' : 'ACTIVE'}
                    variant={quest.completed ? 'emerald' : 'blue'}
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </CornerPanel>
        </div>
      </div>
    </div>
  );
};
