import React, { useState } from 'react';
import {
  QuestItem,
  QuestType,
  SystemRankInfo,
  WorkoutSession,
  MeasurementEntry,
} from '../../domain/types';
import { XP_RULES } from '../../domain/math';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { SystemModal } from '../../components/ui/SystemModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { MetricBadge } from '../../components/ui/MetricBadge';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Zap,
  Shield,
  HeartHandshake,
  Award,
  Flame,
  Activity,
} from 'lucide-react';

interface QuestsModuleProps {
  quests: QuestItem[];
  rankInfo: SystemRankInfo;
  workouts: WorkoutSession[];
  measurements: MeasurementEntry[];
  onToggleQuest: (id: string) => Promise<void>;
  onSaveQuest: (
    quest: Omit<QuestItem, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => Promise<void>;
  onDeleteQuest: (id: string) => Promise<void>;
  onLogRecoveryDay: (date: string, notes?: string) => Promise<void>;
}

export const QuestsModule: React.FC<QuestsModuleProps> = ({
  quests,
  rankInfo,
  workouts,
  measurements,
  onToggleQuest,
  onSaveQuest,
  onDeleteQuest,
  onLogRecoveryDay,
}) => {
  const [activeTab, setActiveTab] = useState<QuestType>('daily');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<QuestType>('daily');
  const [formTarget, setFormTarget] = useState('1');
  const [formCurrent, setFormCurrent] = useState('0');
  const [formUnit, setFormUnit] = useState('Reps');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Deletion state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingId(null);
    setFormTitle('');
    setFormType(activeTab);
    setFormTarget('1');
    setFormCurrent('0');
    setFormUnit('Session');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (quest: QuestItem) => {
    setEditingId(quest.id);
    setFormTitle(quest.title);
    setFormType(quest.type);
    setFormTarget(String(quest.targetValue));
    setFormCurrent(String(quest.currentValue));
    setFormUnit(quest.unit);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError('Title cannot be empty.');
      return;
    }

    const targetVal = parseFloat(formTarget);
    if (isNaN(targetVal) || targetVal <= 0) {
      setFormError('Target value must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveQuest(
        {
          title: formTitle.trim(),
          type: formType,
          targetValue: targetVal,
          currentValue: parseFloat(formCurrent) || 0,
          unit: formUnit.trim() || 'Units',
          completed: (parseFloat(formCurrent) || 0) >= targetVal,
        },
        editingId || undefined
      );
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredQuests = quests.filter((q) => q.type === activeTab);

  // Detailed ledger breakdown
  const regularWorkoutsCount = workouts.filter((w) => !w.isRecoveryDay).length;
  const recoveryDaysCount = workouts.filter((w) => !!w.isRecoveryDay).length;
  const completedQuestsCount = quests.filter((q) => q.completed).length;
  const measurementsCount = measurements.length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE F // DIRECTIVES, GOALS & RANK PROGRESSION
            </h2>
            <MetricBadge label="SOLO LEVELING HUD" variant="blue" icon={Zap} />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Transparent XP ledger, daily directives, weekly conditioning goals & long-term milestones.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TacticalButton
            variant="secondary"
            size="md"
            icon={HeartHandshake}
            onClick={() => onLogRecoveryDay(new Date().toISOString().slice(0, 10))}
          >
            LOG RECOVERY
          </TacticalButton>
          <TacticalButton
            variant="primary"
            size="md"
            icon={Plus}
            onClick={openCreateModal}
          >
            ADD DIRECTIVE
          </TacticalButton>
        </div>
      </div>

      {/* 1. TRANSPARENT SYSTEM XP & RANK LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hunter Status Card */}
        <CornerPanel
          variant="crimson"
          title="Current Rank Status"
          subtitle="Strict Activity-Derived Elevation"
          icon={Shield}
          className="lg:col-span-1 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-3xl font-display font-black text-white">
                  {rankInfo.rank}-RANK
                </span>
                <div className="text-xs font-mono text-combat-crimson font-bold">
                  HUNTER LEVEL {rankInfo.level}
                </div>
              </div>
              <MetricBadge label={rankInfo.title} variant="crimson" />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-ayanokoji-muted">PROGRESSION</span>
                <span className="text-solo-blue font-bold tabular-nums">
                  {rankInfo.currentXP} / {rankInfo.nextRankXP} XP ({rankInfo.progressPercent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-obsidian-void border border-tactical-border rounded-sm overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-combat-crimson to-solo-blue transition-all duration-300"
                  style={{ width: `${Math.max(4, rankInfo.progressPercent)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="pt-3 mt-4 border-t border-tactical-border/60 text-[10px] font-mono text-ayanokoji-muted">
            Rank is strictly driven by objective discipline: logging workouts, biometric checks, and completing directives.
          </div>
        </CornerPanel>

        {/* Detailed XP Breakdown Ledger */}
        <CornerPanel
          variant="blue"
          title="Objective XP Breakdown Ledger"
          subtitle="Non-speculative activity points ledger"
          icon={Award}
          className="lg:col-span-2"
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
            {/* Workouts */}
            <div className="p-3 bg-obsidian-void border border-tactical-border rounded-sm">
              <div className="flex items-center gap-1.5 text-combat-crimson font-semibold">
                <Flame className="w-4 h-4" />
                <span>Workouts</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 tabular-nums">
                {regularWorkoutsCount * XP_RULES.PER_WORKOUT} XP
              </div>
              <div className="text-[10px] text-ayanokoji-muted mt-0.5">
                {regularWorkoutsCount} sessions × 100 XP
              </div>
            </div>

            {/* Recovery Days */}
            <div className="p-3 bg-obsidian-void border border-tactical-border rounded-sm">
              <div className="flex items-center gap-1.5 text-solo-blue font-semibold">
                <HeartHandshake className="w-4 h-4" />
                <span>Recovery</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 tabular-nums">
                {recoveryDaysCount * XP_RULES.PER_RECOVERY_DAY} XP
              </div>
              <div className="text-[10px] text-ayanokoji-muted mt-0.5">
                {recoveryDaysCount} rest days × 40 XP
              </div>
            </div>

            {/* Quests */}
            <div className="p-3 bg-obsidian-void border border-tactical-border rounded-sm">
              <div className="flex items-center gap-1.5 text-status-success font-semibold">
                <ShieldCheck className="w-4 h-4" />
                <span>Directives</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 tabular-nums">
                {completedQuestsCount * XP_RULES.PER_QUEST_COMPLETED} XP
              </div>
              <div className="text-[10px] text-ayanokoji-muted mt-0.5">
                {completedQuestsCount} fulfilled × 25 XP
              </div>
            </div>

            {/* Biometrics */}
            <div className="p-3 bg-obsidian-void border border-tactical-border rounded-sm">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                <Activity className="w-4 h-4" />
                <span>Biometrics</span>
              </div>
              <div className="text-lg font-bold text-white mt-1 tabular-nums">
                {measurementsCount * XP_RULES.PER_MEASUREMENT_LOG} XP
              </div>
              <div className="text-[10px] text-ayanokoji-muted mt-0.5">
                {measurementsCount} logs × 50 XP
              </div>
            </div>
          </div>

          <div className="mt-3 p-2 bg-obsidian-elevated/40 border border-tactical-border/60 rounded-sm text-[10px] font-mono text-ayanokoji-muted">
            Total Ledger Verification: ({regularWorkoutsCount} × 100) + ({recoveryDaysCount} × 40) + ({completedQuestsCount} × 25) + ({measurementsCount} × 50) = <span className="text-white font-bold">{rankInfo.currentXP} XP</span>.
          </div>
        </CornerPanel>
      </div>

      {/* 2. DIRECTIVE PROTOCOL TABS & LIST */}
      <div className="space-y-4">
        {/* Tab switchers */}
        <div className="flex items-center justify-between border-b border-tactical-border/80 pb-2">
          <div className="flex items-center gap-2">
            {(['daily', 'weekly', 'milestone'] as QuestType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 text-xs font-mono uppercase font-bold tracking-wider rounded-sm transition-colors border ${
                  activeTab === tab
                    ? 'border-solo-blue bg-solo-blue/15 text-solo-blue shadow-hud-blue'
                    : 'border-transparent text-ayanokoji-muted hover:text-white'
                }`}
              >
                {tab === 'daily'
                  ? 'DAILY DIRECTIVES'
                  : tab === 'weekly'
                  ? 'WEEKLY PROTOCOLS'
                  : 'LONG-TERM MILESTONES'}
              </button>
            ))}
          </div>

          <span className="text-xs font-mono text-ayanokoji-muted hidden sm:inline">
            {filteredQuests.filter((q) => q.completed).length} / {filteredQuests.length} COMPLETED
          </span>
        </div>

        {/* Quest Items List */}
        <div className="space-y-2.5">
          {filteredQuests.length > 0 ? (
            filteredQuests.map((quest) => (
              <div
                key={quest.id}
                className={`flex items-center justify-between p-3.5 sm:p-4 border rounded-sm transition-colors ${
                  quest.completed
                    ? 'border-status-success/40 bg-status-success/5'
                    : 'border-tactical-border bg-obsidian-charcoal hover:border-solo-blue/50'
                }`}
              >
                <div
                  onClick={() => onToggleQuest(quest.id)}
                  className="flex items-center gap-3.5 cursor-pointer flex-1 select-none"
                >
                  {quest.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-status-success shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-ayanokoji-muted hover:text-solo-blue shrink-0" />
                  )}
                  <div>
                    <h4
                      className={`text-xs sm:text-sm font-display font-bold ${
                        quest.completed ? 'line-through text-ayanokoji-muted' : 'text-white'
                      }`}
                    >
                      {quest.title}
                    </h4>
                    <div className="text-[10px] font-mono text-ayanokoji-muted mt-0.5">
                      Target: {quest.targetValue} {quest.unit}{' '}
                      {quest.lastCompletedDate && `(Last completed: ${quest.lastCompletedDate})`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MetricBadge
                    label={quest.completed ? 'FULFILLED (+25 XP)' : 'ACTIVE PROTOCOL'}
                    variant={quest.completed ? 'emerald' : 'blue'}
                    size="sm"
                  />
                  <button
                    onClick={() => openEditModal(quest)}
                    className="p-1.5 text-ayanokoji-muted hover:text-solo-blue transition-colors rounded-sm"
                    title="Edit Directive"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteId(quest.id)}
                    className="p-1.5 text-ayanokoji-muted hover:text-combat-crimson transition-colors rounded-sm"
                    title="Delete Directive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title={`NO ${activeTab.toUpperCase()} DIRECTIVES ACTIVE`}
              description="Deploy a new objective protocol to maintain daily discipline and build XP."
              actionLabel="DEPLOY DIRECTIVE"
              onAction={openCreateModal}
              actionVariant="primary"
            />
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <SystemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'EDIT DIRECTIVE PROTOCOL' : 'DEPLOY NEW DIRECTIVE PROTOCOL'}
        subtitle="Objective Discipline Target"
        variant="blue"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-sm text-xs font-mono text-red-300">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
              Directive Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Execute 50 Strict Diamond Push-Ups"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Directive Tier
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as QuestType)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              >
                <option value="daily">Daily Directive</option>
                <option value="weekly">Weekly Protocol</option>
                <option value="milestone">Long-Term Milestone</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Unit of Measure
              </label>
              <input
                type="text"
                placeholder="Reps, Minutes, Liters..."
                value={formUnit}
                onChange={(e) => setFormUnit(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Target Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0.1"
                required
                value={formTarget}
                onChange={(e) => setFormTarget(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Current Progress
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={formCurrent}
                onChange={(e) => setFormCurrent(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-tactical-border">
            <TacticalButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              CANCEL
            </TacticalButton>
            <TacticalButton
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting}
            >
              {editingId ? 'COMMIT DIRECTIVE UPDATES' : 'DEPLOY DIRECTIVE'}
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
            await onDeleteQuest(deleteId);
            setDeleteId(null);
          }
        }}
        title="DELETE DIRECTIVE PROTOCOL"
        message="Are you sure you want to permanently erase this quest objective from the active database?"
      />
    </div>
  );
};
