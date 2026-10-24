import React, { useState } from 'react';
import {
  MeasurementEntry,
  StandardMetricKey,
  STANDARD_METRIC_LABELS,
  UserSettings,
} from '../../domain/types';
import {
  validateMeasurementEntry,
  lbsToKg,
} from '../../domain/math';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { SystemModal } from '../../components/ui/SystemModal';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { TrendChart, TrendDataPoint } from '../../components/ui/TrendChart';
import { MetricBadge } from '../../components/ui/MetricBadge';
import {
  Activity,
  Plus,
  Trash2,
  Edit2,
  GitCompare,
  TrendingUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface MeasurementsModuleProps {
  measurements: MeasurementEntry[];
  settings: UserSettings | null;
  onSaveMeasurement: (
    entry: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'>,
    idToUpdate?: string
  ) => Promise<void>;
  onDeleteMeasurement: (id: string) => Promise<void>;
  isOpenModal: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

export const MeasurementsModule: React.FC<MeasurementsModuleProps> = ({
  measurements,
  settings,
  onSaveMeasurement,
  onDeleteMeasurement,
  isOpenModal,
  onCloseModal,
  onOpenModal,
}) => {
  // Modal form states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formUnit, setFormUnit] = useState<'cm' | 'in'>(
    settings?.unitSystem === 'imperial' ? 'in' : 'cm'
  );
  const [formBodyweight, setFormBodyweight] = useState<string>('');
  const [formStandardMetrics, setFormStandardMetrics] = useState<
    Partial<Record<StandardMetricKey, string>>
  >({});
  const [customFields, setCustomFields] = useState<Array<{ name: string; value: string }>>([]);
  const [formNotes, setFormNotes] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Deletion confirm state
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Comparator state
  const [comparatorDateA, setComparatorDateA] = useState<string>(
    measurements[1]?.id || ''
  );
  const [comparatorDateB, setComparatorDateB] = useState<string>(
    measurements[0]?.id || ''
  );

  // Trend chart selector
  const [selectedChartMetric, setSelectedChartMetric] = useState<StandardMetricKey | 'bodyweight'>('chest');

  const openCreateModal = () => {
    setEditingId(null);
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormUnit(settings?.unitSystem === 'imperial' ? 'in' : 'cm');
    setFormBodyweight('');
    setFormStandardMetrics({});
    setCustomFields([]);
    setFormNotes('');
    setFormErrors({});
    onOpenModal();
  };

  const openEditModal = (entry: MeasurementEntry) => {
    setEditingId(entry.id);
    setFormDate(entry.date);
    setFormUnit(entry.unit);
    setFormBodyweight(
      entry.bodyweightKg !== undefined
        ? entry.unit === 'in'
          ? (entry.bodyweightKg * 2.20462).toFixed(1)
          : entry.bodyweightKg.toFixed(1)
        : ''
    );

    const stdStrs: Partial<Record<StandardMetricKey, string>> = {};
    for (const [k, v] of Object.entries(entry.standardMetrics)) {
      if (v !== undefined) {
        stdStrs[k as StandardMetricKey] = String(v);
      }
    }
    setFormStandardMetrics(stdStrs);

    const customs = Object.entries(entry.customMetrics || {}).map(([k, v]) => ({
      name: k,
      value: String(v),
    }));
    setCustomFields(customs);

    setFormNotes(entry.notes || '');
    setFormErrors({});
    onOpenModal();
  };

  const handleStandardMetricChange = (key: StandardMetricKey, val: string) => {
    setFormStandardMetrics((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const handleAddCustomField = () => {
    setCustomFields((prev) => [...prev, { name: '', value: '' }]);
  };

  const handleUpdateCustomField = (index: number, name: string, value: string) => {
    setCustomFields((prev) => {
      const next = [...prev];
      next[index] = { name, value };
      return next;
    });
  };

  const handleRemoveCustomField = (index: number) => {
    setCustomFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      // Parse numbers
      const parsedStandard: Partial<Record<StandardMetricKey, number>> = {};
      for (const [k, v] of Object.entries(formStandardMetrics)) {
        if (v && v.trim() !== '') {
          const num = parseFloat(v);
          parsedStandard[k as StandardMetricKey] = num;
        }
      }

      const parsedCustom: Record<string, number> = {};
      for (const field of customFields) {
        if (field.name.trim() && field.value.trim()) {
          parsedCustom[field.name.trim()] = parseFloat(field.value);
        }
      }

      let parsedBodyweightKg: number | undefined = undefined;
      if (formBodyweight.trim()) {
        const bwNum = parseFloat(formBodyweight);
        parsedBodyweightKg = formUnit === 'in' ? lbsToKg(bwNum) : bwNum;
      }

      const payload: Omit<MeasurementEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        date: formDate,
        unit: formUnit,
        bodyweightKg: parsedBodyweightKg,
        standardMetrics: parsedStandard,
        customMetrics: parsedCustom,
        notes: formNotes.trim() || undefined,
      };

      const validation = validateMeasurementEntry(payload);
      if (!validation.isValid) {
        setFormErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      await onSaveMeasurement(payload, editingId || undefined);
      onCloseModal();
    } catch (err) {
      setFormErrors({ submit: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Comparator calculations
  const entryA = measurements.find((m) => m.id === comparatorDateA);
  const entryB = measurements.find((m) => m.id === comparatorDateB);

  // Prepare trend data
  const trendData: TrendDataPoint[] = [];
  if (selectedChartMetric === 'bodyweight') {
    for (const m of measurements) {
      if (m.bodyweightKg !== undefined) {
        const val =
          settings?.unitSystem === 'imperial'
            ? m.bodyweightKg * 2.20462
            : m.bodyweightKg;
        trendData.push({ date: m.date, value: Number(val.toFixed(1)) });
      }
    }
  } else {
    for (const m of measurements) {
      const val = m.standardMetrics[selectedChartMetric];
      if (val !== undefined) {
        trendData.push({ date: m.date, value: val });
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE B // BIOMETRIC BODY PERIMETERS
            </h2>
            <MetricBadge label="COLD TELEMETRY" variant="blue" />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Objective anatomical tracking across 13 standard sites & date-to-date delta variance.
          </p>
        </div>

        <TacticalButton
          variant="primary"
          size="md"
          icon={Plus}
          onClick={openCreateModal}
        >
          RECORD BIOMETRICS
        </TacticalButton>
      </div>

      {/* TOP COMPARATOR & CHARTS GRID */}
      {measurements.length >= 2 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Date-to-Date Delta Comparator */}
          <CornerPanel
            variant="blue"
            title="Date-to-Date Delta Comparator"
            subtitle="Side-by-side perimeter variance"
            icon={GitCompare}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono text-ayanokoji-muted uppercase mb-1">
                    Baseline Entry (Date A)
                  </label>
                  <select
                    value={comparatorDateA}
                    onChange={(e) => setComparatorDateA(e.target.value)}
                    className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
                  >
                    {measurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.date} ({m.bodyweightKg ? `${m.bodyweightKg}kg` : 'No Weight'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-ayanokoji-muted uppercase mb-1">
                    Target Entry (Date B)
                  </label>
                  <select
                    value={comparatorDateB}
                    onChange={(e) => setComparatorDateB(e.target.value)}
                    className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
                  >
                    {measurements.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.date} ({m.bodyweightKg ? `${m.bodyweightKg}kg` : 'No Weight'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {entryA && entryB ? (
                <div className="space-y-3">
                  <div className="max-h-64 overflow-y-auto space-y-1.5 border border-tactical-border/60 p-2 bg-obsidian-void rounded-sm">
                    {/* Bodyweight Delta */}
                    {entryA.bodyweightKg !== undefined && entryB.bodyweightKg !== undefined && (
                      <div className="flex items-center justify-between p-2 border-b border-tactical-border/40 text-xs font-mono">
                        <span className="text-white font-semibold">Bodyweight</span>
                        <div className="flex items-center gap-4">
                          <span className="text-ayanokoji-muted tabular-nums">
                            {entryA.bodyweightKg.toFixed(1)}kg → {entryB.bodyweightKg.toFixed(1)}kg
                          </span>
                          <span
                            className={`font-bold tabular-nums ${
                              entryB.bodyweightKg - entryA.bodyweightKg > 0
                                ? 'text-status-success'
                                : entryB.bodyweightKg - entryA.bodyweightKg < 0
                                ? 'text-combat-crimson'
                                : 'text-ayanokoji-muted'
                            }`}
                          >
                            {(entryB.bodyweightKg - entryA.bodyweightKg > 0 ? '+' : '') +
                              (entryB.bodyweightKg - entryA.bodyweightKg).toFixed(1)}
                            kg
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Standard sites */}
                    {Object.entries(STANDARD_METRIC_LABELS).map(([key, label]) => {
                      const valA = entryA.standardMetrics[key as StandardMetricKey];
                      const valB = entryB.standardMetrics[key as StandardMetricKey];

                      if (valA === undefined && valB === undefined) return null;

                      const delta =
                        valA !== undefined && valB !== undefined ? valB - valA : null;

                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-1.5 hover:bg-obsidian-elevated/40 text-xs font-mono"
                        >
                          <span className="text-ayanokoji-secondary">{label}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-ayanokoji-muted tabular-nums text-[11px]">
                              {valA !== undefined ? `${valA} ${entryA.unit}` : '—'} →{' '}
                              {valB !== undefined ? `${valB} ${entryB.unit}` : '—'}
                            </span>
                            <span
                              className={`font-bold tabular-nums w-14 text-right ${
                                delta === null
                                  ? 'text-ayanokoji-muted'
                                  : delta > 0
                                  ? 'text-status-success'
                                  : delta < 0
                                  ? 'text-status-warning'
                                  : 'text-ayanokoji-muted'
                              }`}
                            >
                              {delta !== null
                                ? (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1)) +
                                  ` ${entryB.unit}`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Explicit Analytical Disclaimer */}
                  <div className="flex items-start gap-2 bg-obsidian-elevated/80 border border-tactical-border p-2.5 rounded-sm">
                    <HelpCircle className="w-4 h-4 text-solo-blue shrink-0 mt-0.5" />
                    <p className="text-[10px] font-mono text-ayanokoji-secondary leading-relaxed">
                      Tactical note: Short-term circumference deltas primarily reflect intracellular glycogen volume, hydration status, measurement tape tension, and digestive contents rather than localized tissue hypertrophy or fat loss.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </CornerPanel>

          {/* 2. Interactive Trend Trajectory Chart */}
          <CornerPanel
            variant="blue"
            title="Biometric Trajectory Trend"
            subtitle="Chronological historical progression"
            icon={TrendingUp}
            action={
              <select
                value={selectedChartMetric}
                onChange={(e) =>
                  setSelectedChartMetric(e.target.value as StandardMetricKey | 'bodyweight')
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
            <TrendChart
              data={trendData}
              unit={
                selectedChartMetric === 'bodyweight'
                  ? settings?.unitSystem === 'imperial'
                    ? 'lb'
                    : 'kg'
                  : measurements[0]?.unit || 'cm'
              }
              color="blue"
              height={220}
            />
          </CornerPanel>
        </div>
      ) : null}

      {/* HISTORICAL LOG TABLE */}
      <CornerPanel
        variant="neutral"
        title="Biometric Log History"
        subtitle={`${measurements.length} logged checkpoints`}
        icon={Activity}
      >
        {measurements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead>
                <tr className="border-b border-tactical-border text-ayanokoji-muted text-[10px] uppercase tracking-wider bg-obsidian-void/50">
                  <th className="p-3">Date</th>
                  <th className="p-3">Bodyweight</th>
                  <th className="p-3">Key Sites (Chest / Waist / Arm)</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3">Notes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tactical-border/40">
                {measurements.map((entry) => (
                  <tr
                    key={entry.id}
                    className="hover:bg-obsidian-elevated/40 transition-colors"
                  >
                    <td className="p-3 font-semibold text-white tabular-nums">
                      {entry.date}
                    </td>
                    <td className="p-3 text-solo-blue font-bold tabular-nums">
                      {entry.bodyweightKg !== undefined
                        ? settings?.unitSystem === 'imperial'
                          ? `${(entry.bodyweightKg * 2.20462).toFixed(1)} lb`
                          : `${entry.bodyweightKg.toFixed(1)} kg`
                        : '—'}
                    </td>
                    <td className="p-3 text-ayanokoji-slate">
                      <span className="text-ayanokoji-muted">C:</span>{' '}
                      <span className="font-semibold tabular-nums">
                        {entry.standardMetrics.chest || '—'}
                      </span>{' '}
                      <span className="text-ayanokoji-muted ml-2">W:</span>{' '}
                      <span className="font-semibold tabular-nums">
                        {entry.standardMetrics.waist || '—'}
                      </span>{' '}
                      <span className="text-ayanokoji-muted ml-2">A:</span>{' '}
                      <span className="font-semibold tabular-nums">
                        {entry.standardMetrics.rightUpperArm ||
                          entry.standardMetrics.leftUpperArm ||
                          '—'}
                      </span>
                    </td>
                    <td className="p-3 text-ayanokoji-muted uppercase">
                      {entry.unit}
                    </td>
                    <td className="p-3 text-ayanokoji-muted max-w-xs truncate">
                      {entry.notes || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(entry)}
                          className="p-1.5 text-ayanokoji-muted hover:text-solo-blue transition-colors rounded-sm"
                          title="Edit Biometric Entry"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(entry.id)}
                          className="p-1.5 text-ayanokoji-muted hover:text-combat-crimson transition-colors rounded-sm"
                          title="Delete Biometric Entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="ZERO BIOMETRIC RECORDS"
            description="Your biometric database is empty. Establish baseline measurements across your physical structure."
            actionLabel="RECORD BASELINE"
            onAction={openCreateModal}
            actionVariant="primary"
          />
        )}
      </CornerPanel>

      {/* CREATE / EDIT MODAL */}
      <SystemModal
        isOpen={isOpenModal}
        onClose={onCloseModal}
        title={editingId ? 'EDIT BIOMETRIC ENTRY' : 'RECORD BIOMETRIC CHECKPOINT'}
        subtitle="13 Standard Anatomical Sites + Dynamic Custom Parameters"
        variant="blue"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {formErrors.submit && (
            <div className="p-3 bg-red-950/40 border border-red-700/60 rounded-sm flex items-center gap-2 text-xs text-red-300 font-mono">
              <AlertCircle className="w-4 h-4 text-combat-crimson shrink-0" />
              {formErrors.submit}
            </div>
          )}

          {/* Top Control Bar: Date, Unit Toggle, Bodyweight */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-obsidian-void border border-tactical-border rounded-sm">
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Record Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                required
                className="w-full bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
              {formErrors.date && (
                <span className="text-[10px] font-mono text-combat-crimson mt-0.5 block">
                  {formErrors.date}
                </span>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Perimeter Unit
              </label>
              <div className="flex border border-tactical-border rounded-sm overflow-hidden">
                <button
                  type="button"
                  onClick={() => setFormUnit('cm')}
                  className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                    formUnit === 'cm'
                      ? 'bg-solo-blue text-obsidian-void'
                      : 'bg-obsidian-charcoal text-ayanokoji-muted hover:text-white'
                  }`}
                >
                  CENTIMETERS (cm)
                </button>
                <button
                  type="button"
                  onClick={() => setFormUnit('in')}
                  className={`flex-1 py-2 text-xs font-mono font-bold transition-colors ${
                    formUnit === 'in'
                      ? 'bg-solo-blue text-obsidian-void'
                      : 'bg-obsidian-charcoal text-ayanokoji-muted hover:text-white'
                  }`}
                >
                  INCHES (in)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Bodyweight ({formUnit === 'in' ? 'lb' : 'kg'})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder={formUnit === 'in' ? 'e.g. 182.5' : 'e.g. 82.5'}
                value={formBodyweight}
                onChange={(e) => setFormBodyweight(e.target.value)}
                className="w-full bg-obsidian-charcoal border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
              />
              {formErrors.bodyweightKg && (
                <span className="text-[10px] font-mono text-combat-crimson mt-0.5 block">
                  {formErrors.bodyweightKg}
                </span>
              )}
            </div>
          </div>

          {/* 13 Standard Anatomical Sites */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-tactical-border/60">
              <span className="text-xs font-display font-bold uppercase text-white tracking-wider">
                13 STANDARD ANATOMICAL SITES ({formUnit})
              </span>
              <span className="text-[10px] font-mono text-ayanokoji-muted">
                Validation: Positive numbers between 5-300cm
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {(Object.keys(STANDARD_METRIC_LABELS) as StandardMetricKey[]).map((key) => {
                const label = STANDARD_METRIC_LABELS[key];
                const err = formErrors[`standardMetrics.${key}`];
                return (
                  <div key={key}>
                    <label className="block text-[10px] font-mono text-ayanokoji-muted uppercase truncate mb-1">
                      {label}
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="—"
                      value={formStandardMetrics[key] || ''}
                      onChange={(e) => handleStandardMetricChange(key, e.target.value)}
                      className={`w-full bg-obsidian-void border ${
                        err ? 'border-combat-crimson' : 'border-tactical-border'
                      } text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none`}
                    />
                    {err && (
                      <span className="text-[9px] font-mono text-combat-crimson mt-0.5 block truncate">
                        {err}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Custom Measurement Fields */}
          <div className="space-y-3 pt-2 border-t border-tactical-border/60">
            <div className="flex items-center justify-between">
              <span className="text-xs font-display font-bold uppercase text-white tracking-wider">
                CUSTOM ANATOMICAL SITES
              </span>
              <TacticalButton
                type="button"
                variant="secondary"
                size="sm"
                icon={Plus}
                onClick={handleAddCustomField}
              >
                ADD CUSTOM SITE
              </TacticalButton>
            </div>

            {customFields.length > 0 && (
              <div className="space-y-2">
                {customFields.map((field, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Site Name (e.g. Wrist, Lower Calf)"
                      value={field.name}
                      onChange={(e) =>
                        handleUpdateCustomField(idx, e.target.value, field.value)
                      }
                      className="flex-1 bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
                    />
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder={`Value (${formUnit})`}
                      value={field.value}
                      onChange={(e) =>
                        handleUpdateCustomField(idx, field.name, e.target.value)
                      }
                      className="w-28 bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(idx)}
                      className="p-2 text-ayanokoji-muted hover:text-combat-crimson transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
              Check Context & Notes (e.g. Post-fast, morning, hydration level)
            </label>
            <textarea
              rows={2}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Cold morning protocol; relaxed tape measurement..."
              className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2 rounded-sm focus:border-solo-blue focus:outline-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-tactical-border">
            <TacticalButton
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCloseModal}
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
              {editingId ? 'UPDATE BIOMETRIC ENTRY' : 'COMMIT BIOMETRIC LOG'}
            </TacticalButton>
          </div>
        </form>
      </SystemModal>

      {/* DELETE CONFIRMATION DIALOG */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            await onDeleteMeasurement(deleteId);
            setDeleteId(null);
          }
        }}
        title="DELETE BIOMETRIC CHECKPOINT"
        message="Are you sure you want to permanently erase this biometric measurement record? This action cannot be undone."
      />
    </div>
  );
};
