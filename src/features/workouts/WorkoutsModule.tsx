import React, { useState } from 'react';
import {
  WorkoutSession,
  ExerciseDefinition,
  WorkoutExerciseLog,
  ExerciseSet,
  ExerciseCategory,
  UserSettings,
} from '../../domain/types';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { SystemModal } from '../../components/ui/SystemModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetricBadge } from '../../components/ui/MetricBadge';
import { CombatTimer } from '../../components/ui/CombatTimer';
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  Copy,
  Trophy,
  Search,
  Clock,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface WorkoutsModuleProps {
  workouts: WorkoutSession[];
  exercises: ExerciseDefinition[];
  settings: UserSettings | null;
  onSaveWorkout: (
    workout: Omit<WorkoutSession, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => Promise<void>;
  onDeleteWorkout: (id: string) => Promise<void>;
  onCreateExercise: (exercise: Omit<ExerciseDefinition, 'id'>) => Promise<ExerciseDefinition>;
  isOpenModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
  onLogRecoveryDay: (date: string, notes?: string) => Promise<void>;
}

export const WorkoutsModule: React.FC<WorkoutsModuleProps> = ({
  workouts,
  exercises,
  settings,
  onSaveWorkout,
  onDeleteWorkout,
  onCreateExercise,
  isOpenModal,
  onCloseModal,
  onOpenModal,
  onLogRecoveryDay,
}) => {
  // Session builder state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState<string>(
    new Date().toISOString().slice(0, 10)
  );
  const [sessionTitle, setSessionTitle] = useState<string>('Tactical Hypertrophy');
  const [sessionDuration, setSessionDuration] = useState<string>('60');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [sessionExercises, setSessionExercises] = useState<WorkoutExerciseLog[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Quick exercise creator modal state
  const [isCreatingExercise, setIsCreatingExercise] = useState(false);
  const [newExName, setNewExName] = useState('');
  const [newExCategory, setNewExCategory] = useState<ExerciseCategory>('weighted');
  const [newExMuscle, setNewExMuscle] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // Deletion confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Expanded workout cards in history
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());

  const toggleExpandSession = (id: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setSessionDate(new Date().toISOString().slice(0, 10));
    setSessionTitle('Tactical Conditioning Protocol');
    setSessionDuration('60');
    setSessionNotes('');
    setSessionExercises([]);
    setSessionError(null);
    onOpenModal();
  };

  const openEditModal = (session: WorkoutSession) => {
    setEditingId(session.id);
    setSessionDate(session.date);
    setSessionTitle(session.title);
    setSessionDuration(session.durationMinutes ? String(session.durationMinutes) : '');
    setSessionNotes(session.notes || '');
    setSessionExercises(JSON.parse(JSON.stringify(session.exercises)));
    setSessionError(null);
    onOpenModal();
  };

  // Exercise manipulation inside builder
  const handleAddExerciseToSession = (exerciseId: string) => {
    const exDef = exercises.find((e) => e.id === exerciseId);
    if (!exDef) return;

    const defaultSet: ExerciseSet = {
      id: crypto.randomUUID(),
      setNumber: 1,
      weightUnit: settings?.unitSystem === 'imperial' ? 'lb' : 'kg',
      weight: exDef.category === 'weighted' ? 60 : undefined,
      reps: exDef.category !== 'timed_track' ? 10 : undefined,
      isBodyweight: exDef.category === 'bodyweight',
      durationSeconds: exDef.category === 'timed_track' ? 300 : undefined,
      distanceMeters: exDef.category === 'timed_track' ? 1000 : undefined,
    };

    const newLog: WorkoutExerciseLog = {
      id: crypto.randomUUID(),
      exerciseId: exDef.id,
      exerciseName: exDef.name,
      category: exDef.category,
      sets: [defaultSet],
    };

    setSessionExercises((prev) => [...prev, newLog]);
  };

  const handleRemoveExercise = (exLogId: string) => {
    setSessionExercises((prev) => prev.filter((e) => e.id !== exLogId));
  };

  const handleAddSet = (exLogId: string) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exLogId) return ex;
        const lastSet = ex.sets[ex.sets.length - 1];
        const newSet: ExerciseSet = {
          id: crypto.randomUUID(),
          setNumber: ex.sets.length + 1,
          weight: lastSet?.weight,
          weightUnit: lastSet?.weightUnit || (settings?.unitSystem === 'imperial' ? 'lb' : 'kg'),
          reps: lastSet?.reps,
          isBodyweight: lastSet?.isBodyweight,
          addedWeight: lastSet?.addedWeight,
          durationSeconds: lastSet?.durationSeconds,
          distanceMeters: lastSet?.distanceMeters,
          laps: lastSet?.laps,
        };
        return {
          ...ex,
          sets: [...ex.sets, newSet],
        };
      })
    );
  };

  const handleDuplicateSet = (exLogId: string, setIndex: number) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exLogId) return ex;
        const target = ex.sets[setIndex];
        const duplicated: ExerciseSet = {
          ...target,
          id: crypto.randomUUID(),
          setNumber: ex.sets.length + 1,
        };
        return {
          ...ex,
          sets: [...ex.sets, duplicated],
        };
      })
    );
  };

  const handleRemoveSet = (exLogId: string, setId: string) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exLogId) return ex;
        const filtered = ex.sets.filter((s) => s.id !== setId);
        const renumbered = filtered.map((s, idx) => ({ ...s, setNumber: idx + 1 }));
        return {
          ...ex,
          sets: renumbered,
        };
      })
    );
  };

  const handleUpdateSet = (
    exLogId: string,
    setId: string,
    patch: Partial<ExerciseSet>
  ) => {
    setSessionExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exLogId) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)),
        };
      })
    );
  };

  const handleSaveExerciseDefinition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    try {
      const created = await onCreateExercise({
        name: newExName.trim(),
        category: newExCategory,
        primaryMuscle: newExMuscle.trim() || 'General Conditioning',
        isCustom: true,
      });
      setIsCreatingExercise(false);
      setNewExName('');
      setNewExMuscle('');
      // Auto add to current session
      handleAddExerciseToSession(created.id);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSessionError(null);

    if (!sessionTitle.trim()) {
      setSessionError('Session title is required.');
      return;
    }
    if (sessionExercises.length === 0) {
      setSessionError('At least one exercise drill must be included.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveWorkout(
        {
          date: sessionDate,
          title: sessionTitle.trim(),
          durationMinutes: sessionDuration ? parseInt(sessionDuration, 10) : undefined,
          notes: sessionNotes.trim() || undefined,
          exercises: sessionExercises,
        },
        editingId || undefined
      );
      onCloseModal();
    } catch (err) {
      setSessionError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter sessions
  const filteredWorkouts = workouts.filter((w) => {
    const matchesSearch =
      w.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.exercises.some((ex) =>
        ex.exerciseName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    if (!matchesSearch) return false;

    if (selectedFilterCategory === 'recovery') return !!w.isRecoveryDay;
    if (selectedFilterCategory === 'weighted')
      return w.exercises.some((e) => e.category === 'weighted');
    if (selectedFilterCategory === 'bodyweight')
      return w.exercises.some((e) => e.category === 'bodyweight');
    if (selectedFilterCategory === 'timed_track')
      return w.exercises.some((e) => e.category === 'timed_track');

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE C // WORKOUT & CONDITIONING LOGGER
            </h2>
            <MetricBadge label="COMBAT RIGOR" variant="crimson" />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Weighted drills, strict bodyweight, sprint/track laps & automated PR calculation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CombatTimer />
          <TacticalButton
            variant="secondary"
            size="md"
            icon={HeartHandshake}
            onClick={() => onLogRecoveryDay(new Date().toISOString().slice(0, 10))}
          >
            LOG RECOVERY
          </TacticalButton>
          <TacticalButton
            variant="crimson"
            size="md"
            icon={Plus}
            onClick={openCreateModal}
          >
            BUILD WORKOUT
          </TacticalButton>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-obsidian-charcoal p-3 border border-tactical-border rounded-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-ayanokoji-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search drill names, session titles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-obsidian-void border border-tactical-border pl-9 pr-3 py-2 text-xs font-mono text-white rounded-sm focus:border-combat-crimson focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-ayanokoji-muted uppercase">Category:</span>
          <select
            value={selectedFilterCategory}
            onChange={(e) => setSelectedFilterCategory(e.target.value)}
            className="bg-obsidian-void border border-tactical-border text-xs font-mono text-white px-2.5 py-2 rounded-sm focus:border-combat-crimson focus:outline-none"
          >
            <option value="all">ALL SESSIONS</option>
            <option value="weighted">WEIGHTED RIGOR</option>
            <option value="bodyweight">BODYWEIGHT / CALISTHENICS</option>
            <option value="timed_track">TIMED TRACK / LAPS</option>
            <option value="recovery">RECOVERY PROTOCOLS</option>
          </select>
        </div>
      </div>

      {/* WORKOUT SESSIONS LIST */}
      <div className="space-y-4">
        {filteredWorkouts.length > 0 ? (
          filteredWorkouts.map((session) => {
            const isExpanded = expandedSessionIds.has(session.id);
            const prSetsCount = session.exercises.reduce(
              (count, ex) => count + ex.sets.filter((s) => s.isPR).length,
              0
            );

            return (
              <div
                key={session.id}
                className={`border rounded-sm transition-all duration-150 ${
                  session.isRecoveryDay
                    ? 'border-solo-blue/40 bg-obsidian-charcoal/70'
                    : 'border-tactical-border bg-obsidian-charcoal hover:border-combat-crimson/60'
                }`}
              >
                {/* Session Header Card */}
                <div
                  onClick={() => toggleExpandSession(session.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2 border rounded-sm ${
                        session.isRecoveryDay
                          ? 'border-solo-blue bg-solo-blue/15 text-solo-blue'
                          : 'border-combat-crimson bg-combat-crimson/15 text-combat-crimson shadow-hud-crimson'
                      }`}
                    >
                      {session.isRecoveryDay ? (
                        <HeartHandshake className="w-5 h-5" />
                      ) : (
                        <Flame className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h3 className="font-display font-bold text-sm sm:text-base text-white uppercase tracking-wider">
                          {session.title}
                        </h3>
                        {prSetsCount > 0 && (
                          <MetricBadge
                            label={`${prSetsCount} PR`}
                            variant="crimson"
                            icon={Trophy}
                          />
                        )}
                        {session.isRecoveryDay && (
                          <MetricBadge label="RECOVERY DAY" variant="blue" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono text-ayanokoji-muted mt-1">
                        <span className="text-ayanokoji-secondary">{session.date}</span>
                        {session.durationMinutes && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {session.durationMinutes} min
                            </span>
                          </>
                        )}
                        <span>•</span>
                        <span>{session.exercises.length} Drills</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(session);
                      }}
                      className="p-2 text-ayanokoji-muted hover:text-solo-blue transition-colors rounded-sm"
                      title="Edit Session"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(session.id);
                      }}
                      className="p-2 text-ayanokoji-muted hover:text-combat-crimson transition-colors rounded-sm"
                      title="Delete Session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="p-2 text-ayanokoji-muted">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-5 sm:px-6 border-t border-tactical-border/70 pt-4 space-y-4 bg-obsidian-void/60">
                    {session.notes && (
                      <p className="text-xs font-mono text-ayanokoji-secondary bg-obsidian-elevated/60 p-2.5 border-l-2 border-tactical-border">
                        {session.notes}
                      </p>
                    )}

                    {session.exercises.length > 0 ? (
                      <div className="space-y-3">
                        {session.exercises.map((ex) => (
                          <div
                            key={ex.id}
                            className="border border-tactical-border/60 bg-obsidian-charcoal p-3 rounded-sm space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-display font-semibold text-xs sm:text-sm text-white">
                                  {ex.exerciseName}
                                </span>
                                <span className="text-[10px] font-mono uppercase text-ayanokoji-muted px-1.5 py-0.5 border border-tactical-border rounded-sm">
                                  {ex.category}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-ayanokoji-muted tabular-nums">
                                {ex.sets.length} sets
                              </span>
                            </div>

                            {/* Sets Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs font-mono">
                                <thead>
                                  <tr className="text-[10px] text-ayanokoji-muted border-b border-tactical-border/40 uppercase">
                                    <th className="py-1 px-2 w-12">Set</th>
                                    {ex.category === 'weighted' && (
                                      <>
                                        <th className="py-1 px-2">Weight</th>
                                        <th className="py-1 px-2">Reps</th>
                                      </>
                                    )}
                                    {ex.category === 'bodyweight' && (
                                      <>
                                        <th className="py-1 px-2">Reps</th>
                                        <th className="py-1 px-2">Added Load</th>
                                      </>
                                    )}
                                    {ex.category === 'timed_track' && (
                                      <>
                                        <th className="py-1 px-2">Duration</th>
                                        <th className="py-1 px-2">Distance / Laps</th>
                                      </>
                                    )}
                                    <th className="py-1 px-2 text-right">Result</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-tactical-border/20">
                                  {ex.sets.map((s) => (
                                    <tr key={s.id} className="hover:bg-obsidian-elevated/40">
                                      <td className="py-1.5 px-2 text-ayanokoji-muted">
                                        #{s.setNumber}
                                      </td>
                                      {ex.category === 'weighted' && (
                                        <>
                                          <td className="py-1.5 px-2 font-semibold text-white tabular-nums">
                                            {s.weight !== undefined
                                              ? `${s.weight} ${s.weightUnit || 'kg'}`
                                              : '—'}
                                          </td>
                                          <td className="py-1.5 px-2 font-semibold text-white tabular-nums">
                                            {s.reps !== undefined ? `${s.reps} reps` : '—'}
                                          </td>
                                        </>
                                      )}
                                      {ex.category === 'bodyweight' && (
                                        <>
                                          <td className="py-1.5 px-2 font-semibold text-white tabular-nums">
                                            {s.reps !== undefined ? `${s.reps} reps` : '—'}
                                          </td>
                                          <td className="py-1.5 px-2 text-ayanokoji-secondary tabular-nums">
                                            {s.addedWeight
                                              ? `+${s.addedWeight} ${s.weightUnit || 'kg'}`
                                              : 'Bodyweight'}
                                          </td>
                                        </>
                                      )}
                                      {ex.category === 'timed_track' && (
                                        <>
                                          <td className="py-1.5 px-2 font-semibold text-white tabular-nums">
                                            {s.durationSeconds ? `${s.durationSeconds}s` : '—'}
                                          </td>
                                          <td className="py-1.5 px-2 text-ayanokoji-secondary tabular-nums">
                                            {s.distanceMeters ? `${s.distanceMeters}m` : ''}{' '}
                                            {s.laps ? `(${s.laps} laps)` : ''}
                                          </td>
                                        </>
                                      )}
                                      <td className="py-1.5 px-2 text-right">
                                        {s.isPR ? (
                                          <MetricBadge
                                            label="PR VERIFIED"
                                            variant="crimson"
                                            size="sm"
                                            icon={Trophy}
                                          />
                                        ) : (
                                          <span className="text-[10px] text-ayanokoji-muted">
                                            STANDARD
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-ayanokoji-muted">
                        No individual exercise logs recorded for this recovery protocol.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <EmptyState
            title="NO RECORDED WORKOUT SESSIONS"
            description="Zero sessions found matching current filters. Initialize a combat workout protocol to start logging."
            actionLabel="BUILD WORKOUT PROTOCOL"
            onAction={openCreateModal}
            actionVariant="crimson"
          />
        )}
      </div>

      {/* WORKOUT BUILDER / EDITOR MODAL */}
      <SystemModal
        isOpen={isOpenModal}
        onClose={onCloseModal}
        title={editingId ? 'EDIT WORKOUT SESSION' : 'TACTICAL WORKOUT BUILDER'}
        subtitle="Drill Composition, Set Logs & PR Tracking"
        variant="crimson"
        maxWidth="4xl"
      >
        <form onSubmit={handleSessionSubmit} className="space-y-6">
          {sessionError && (
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-sm text-xs font-mono text-red-300">
              {sessionError}
            </div>
          )}

          {/* Top Session Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-obsidian-void border border-tactical-border rounded-sm">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Session Date
              </label>
              <input
                type="date"
                required
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Session Title / Protocol
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Upper Heavy Combat"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                className="w-full bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min="1"
                placeholder="60"
                value={sessionDuration}
                onChange={(e) => setSessionDuration(e.target.value)}
                className="w-full bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
              />
            </div>
          </div>

          {/* Exercise Addition Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-obsidian-elevated/40 border border-tactical-border rounded-sm">
            <div className="flex-1 flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase text-ayanokoji-muted whitespace-nowrap">
                ADD DRILL:
              </span>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddExerciseToSession(e.target.value);
                    e.target.value = '';
                  }
                }}
                defaultValue=""
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
              >
                <option value="" disabled>
                  Select from arsenal...
                </option>
                {exercises.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category.toUpperCase()} // {ex.primaryMuscle})
                  </option>
                ))}
              </select>
            </div>

            <TacticalButton
              type="button"
              variant="secondary"
              size="sm"
              icon={Plus}
              onClick={() => setIsCreatingExercise(true)}
            >
              CREATE NEW EXERCISE
            </TacticalButton>
          </div>

          {/* Quick Create Exercise Inline Modal / Card */}
          {isCreatingExercise && (
            <div className="p-4 bg-obsidian-void border border-combat-crimson/50 rounded-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-tactical-border/60">
                <span className="text-xs font-display font-bold uppercase text-white tracking-wider">
                  REGISTER NEW ARSENAL DRILL
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingExercise(false)}
                  className="text-xs font-mono text-ayanokoji-muted hover:text-white"
                >
                  CANCEL
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Exercise Name (e.g. Zercher Squat)"
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
                />
                <select
                  value={newExCategory}
                  onChange={(e) => setNewExCategory(e.target.value as ExerciseCategory)}
                  className="bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
                >
                  <option value="weighted">Weighted</option>
                  <option value="bodyweight">Bodyweight / Calisthenics</option>
                  <option value="timed_track">Timed Track / Laps</option>
                </select>
                <input
                  type="text"
                  placeholder="Target Muscle (e.g. Glutes/Quads)"
                  value={newExMuscle}
                  onChange={(e) => setNewExMuscle(e.target.value)}
                  className="bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <TacticalButton
                  type="button"
                  variant="crimson"
                  size="sm"
                  onClick={handleSaveExerciseDefinition}
                >
                  ADD TO ARSENAL & WORKOUT
                </TacticalButton>
              </div>
            </div>
          )}

          {/* Added Exercises List */}
          <div className="space-y-4">
            {sessionExercises.map((exLog, exIdx) => (
              <div
                key={exLog.id}
                className="border border-tactical-border bg-obsidian-charcoal p-4 rounded-sm space-y-3"
              >
                <div className="flex items-center justify-between border-b border-tactical-border/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-combat-crimson">
                      {exIdx + 1}.
                    </span>
                    <span className="font-display font-bold text-sm text-white">
                      {exLog.exerciseName}
                    </span>
                    <span className="text-[9px] font-mono uppercase bg-obsidian-void px-1.5 py-0.5 border border-tactical-border text-ayanokoji-muted rounded-sm">
                      {exLog.category}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(exLog.id)}
                    className="text-ayanokoji-muted hover:text-combat-crimson p-1"
                    title="Remove Exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Sets Editor */}
                <div className="space-y-2">
                  {exLog.sets.map((set, setIdx) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-12 gap-2 items-center bg-obsidian-void p-2 border border-tactical-border/60 rounded-sm text-xs font-mono"
                    >
                      <div className="col-span-1 text-center font-bold text-ayanokoji-muted">
                        #{set.setNumber}
                      </div>

                      {exLog.category === 'weighted' && (
                        <>
                          <div className="col-span-5 flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="Weight"
                              value={set.weight !== undefined ? set.weight : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  weight: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                            <select
                              value={set.weightUnit || 'kg'}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  weightUnit: e.target.value as 'kg' | 'lb',
                                })
                              }
                              className="bg-obsidian-charcoal border border-tactical-border p-1.5 text-ayanokoji-muted rounded-sm focus:outline-none"
                            >
                              <option value="kg">kg</option>
                              <option value="lb">lb</option>
                            </select>
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="Reps"
                              value={set.reps !== undefined ? set.reps : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  reps: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      {exLog.category === 'bodyweight' && (
                        <>
                          <div className="col-span-5">
                            <input
                              type="number"
                              placeholder="Reps"
                              value={set.reps !== undefined ? set.reps : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  reps: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                          </div>
                          <div className="col-span-4 flex items-center gap-1.5">
                            <input
                              type="number"
                              step="0.5"
                              placeholder="+Added (0 for strict BW)"
                              value={set.addedWeight !== undefined ? set.addedWeight : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  addedWeight: e.target.value ? parseFloat(e.target.value) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                            <span className="text-ayanokoji-muted text-[10px]">kg</span>
                          </div>
                        </>
                      )}

                      {exLog.category === 'timed_track' && (
                        <>
                          <div className="col-span-5">
                            <input
                              type="number"
                              placeholder="Duration (sec)"
                              value={set.durationSeconds !== undefined ? set.durationSeconds : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  durationSeconds: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                          </div>
                          <div className="col-span-4">
                            <input
                              type="number"
                              placeholder="Distance (m)"
                              value={set.distanceMeters !== undefined ? set.distanceMeters : ''}
                              onChange={(e) =>
                                handleUpdateSet(exLog.id, set.id, {
                                  distanceMeters: e.target.value ? parseInt(e.target.value, 10) : undefined,
                                })
                              }
                              className="w-full bg-obsidian-charcoal border border-tactical-border p-1.5 text-white rounded-sm focus:border-combat-crimson focus:outline-none"
                            />
                          </div>
                        </>
                      )}

                      {/* Action buttons */}
                      <div className="col-span-2 flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateSet(exLog.id, setIdx)}
                          className="p-1 text-ayanokoji-muted hover:text-solo-blue"
                          title="Duplicate Set"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveSet(exLog.id, set.id)}
                          className="p-1 text-ayanokoji-muted hover:text-combat-crimson"
                          title="Delete Set"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add set button */}
                <div className="flex justify-start">
                  <TacticalButton
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={Plus}
                    onClick={() => handleAddSet(exLog.id)}
                  >
                    ADD SET
                  </TacticalButton>
                </div>
              </div>
            ))}

            {sessionExercises.length === 0 && (
              <div className="p-8 border border-dashed border-tactical-border text-center text-xs font-mono text-ayanokoji-muted">
                No exercise drills attached to this session yet. Use the dropdown above to add drills.
              </div>
            )}
          </div>

          {/* Session Notes */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
              Combat Notes / Subjective RPE & Conditions
            </label>
            <textarea
              rows={2}
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Felt explosive on top sets; high mechanical tension throughout..."
              className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-combat-crimson focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-tactical-border">
            <TacticalButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCloseModal}
              disabled={isSubmitting}
            >
              ABORT
            </TacticalButton>
            <TacticalButton
              type="submit"
              variant="crimson"
              size="md"
              loading={isSubmitting}
            >
              {editingId ? 'COMMIT SESSION UPDATES' : 'COMMIT WORKOUT SESSION'}
            </TacticalButton>
          </div>
        </form>
      </SystemModal>

      {/* DELETE CONFIRM DIALOG */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteWorkout(deleteId);
            setDeleteId(null);
          }
        }}
        title="DELETE WORKOUT LOG"
        message="Are you sure you want to permanently delete this workout session? Personal record computations will be recalculated accordingly."
      />
    </div>
  );
};
