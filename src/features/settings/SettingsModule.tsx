import React, { useState, useRef } from 'react';
import { UserSettings } from '../../domain/types';
import { exportSystemBackup, restoreSystemBackup, purgeAllLocalData } from '../../db/backup';
import { CornerPanel } from '../../components/ui/CornerPanel';
import { TacticalButton } from '../../components/ui/TacticalButton';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { MetricBadge } from '../../components/ui/MetricBadge';
import {
  Download,
  Upload,
  Trash2,
  Database,
  ShieldAlert,
  Sliders,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface SettingsModuleProps {
  settings: UserSettings | null;
  onUpdateSettings: (patch: Partial<UserSettings>) => Promise<void>;
  onRefreshData: () => Promise<void>;
}

export const SettingsModule: React.FC<SettingsModuleProps> = ({
  settings,
  onUpdateSettings,
  onRefreshData,
}) => {
  // Settings edit state
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>(
    settings?.unitSystem || 'metric'
  );
  const [journeyStartDate, setJourneyStartDate] = useState<string>(
    settings?.journeyStartDate || new Date().toISOString().slice(0, 10)
  );
  const [currentArcName, setCurrentArcName] = useState<string>(
    settings?.currentArcName || 'FOUNDATION ARC'
  );
  const [reducedMotion, setReducedMotion] = useState<boolean>(
    settings?.reducedMotion || false
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [backupNotice, setBackupNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Purge confirmation dialog
  const [isPurgeDialogOpen, setIsPurgeDialogOpen] = useState(false);
  const [isPurging, setIsPurging] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      await onUpdateSettings({
        unitSystem,
        journeyStartDate,
        currentArcName: currentArcName.trim() || 'FOUNDATION ARC',
        reducedMotion,
      });
      setSaveStatus('System parameters updated successfully.');
      setTimeout(() => setSaveStatus(null), 3500);
    } catch (err) {
      alert(err instanceof Error ? err.message : String(err));
    }
  };

  const handleExportBackup = async () => {
    setIsExporting(true);
    setBackupNotice(null);
    try {
      const envelope = await exportSystemBackup();
      const jsonString = JSON.stringify(envelope, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `anime-physique-os-backup-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const counts = envelope.checksum.recordCounts;
      setBackupNotice({
        type: 'success',
        message: `Backup archive exported successfully (${counts.workouts} workouts, ${counts.measurements} biometrics, ${counts.photos} photos).`,
      });
    } catch (err) {
      setBackupNotice({
        type: 'error',
        message: `Export failure: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setBackupNotice(null);

    try {
      const rawText = await file.text();
      const result = await restoreSystemBackup(rawText, importMode);

      setBackupNotice({
        type: 'success',
        message: `${result.message} Loaded ${result.recordCounts.workouts} workouts, ${result.recordCounts.measurements} biometric records, and ${result.recordCounts.photos} binary photo blobs.`,
      });

      await onRefreshData();
    } catch (err) {
      setBackupNotice({
        type: 'error',
        message: `Restore rejected: ${err instanceof Error ? err.message : String(err)}`,
      });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePurgeAllData = async () => {
    setIsPurging(true);
    try {
      await purgeAllLocalData();
      await onRefreshData();
      setIsPurgeDialogOpen(false);
      setBackupNotice({
        type: 'success',
        message: 'All local IndexedDB tables purged successfully. System re-initialized.',
      });
    } catch (err) {
      alert(`Purge failure: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-tactical-border/70 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display font-extrabold text-lg sm:text-xl text-white tracking-wide uppercase">
              MODULE G // SYSTEM CONFIG & OFFLINE VAULT
            </h2>
            <MetricBadge label="TRANSACTION SAFE" variant="blue" />
          </div>
          <p className="text-xs text-ayanokoji-muted font-mono mt-0.5">
            Unit standards, training arc codenames, Base64 JSON backups & atomic restore operations.
          </p>
        </div>
      </div>

      {/* Notifications Banner */}
      {backupNotice && (
        <div
          className={`p-4 rounded-sm border flex items-start gap-3 font-mono text-xs ${
            backupNotice.type === 'success'
              ? 'bg-status-success/10 border-status-success/50 text-status-success'
              : 'bg-red-950/40 border-red-700/60 text-red-300'
          }`}
        >
          {backupNotice.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-status-success" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0 text-combat-crimson" />
          )}
          <div className="space-y-0.5">
            <span className="font-bold uppercase tracking-wider">
              {backupNotice.type === 'success' ? 'SYSTEM DIRECTIVE CONFIRMED' : 'RESTORE REJECTED'}
            </span>
            <p className="text-[11px] text-ayanokoji-slate leading-relaxed">
              {backupNotice.message}
            </p>
          </div>
        </div>
      )}

      {/* 1. SYSTEM CONFIGURATION PARAMETERS */}
      <CornerPanel
        variant="blue"
        title="Tactical System Configuration"
        subtitle="Global unit parameters & journey metadata"
        icon={Sliders}
      >
        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Preferred Unit System */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Standard Unit System
              </label>
              <select
                value={unitSystem}
                onChange={(e) => setUnitSystem(e.target.value as 'metric' | 'imperial')}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2.5 rounded-sm focus:border-solo-blue focus:outline-none"
              >
                <option value="metric">Metric (cm / kg)</option>
                <option value="imperial">Imperial (in / lb)</option>
              </select>
            </div>

            {/* Journey Start Date */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Journey Awakening Date
              </label>
              <input
                type="date"
                required
                value={journeyStartDate}
                onChange={(e) => setJourneyStartDate(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2.5 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>

            {/* Current Arc Title */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Current Training Arc Codename
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DEMON BACK PROTOCOL"
                value={currentArcName}
                onChange={(e) => setCurrentArcName(e.target.value)}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2.5 rounded-sm focus:border-solo-blue focus:outline-none"
              />
            </div>

            {/* Reduced Motion Toggle */}
            <div>
              <label className="block text-[10px] font-mono uppercase text-ayanokoji-muted mb-1">
                Motion Ergonomics
              </label>
              <select
                value={reducedMotion ? 'true' : 'false'}
                onChange={(e) => setReducedMotion(e.target.value === 'true')}
                className="w-full bg-obsidian-void border border-tactical-border text-xs font-mono text-white p-2.5 rounded-sm focus:border-solo-blue focus:outline-none"
              >
                <option value="false">Standard Dynamic HUD</option>
                <option value="true">Reduced Motion (Zero Animations)</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-tactical-border/60">
            {saveStatus && (
              <span className="text-xs font-mono text-status-success font-semibold">
                {saveStatus}
              </span>
            )}
            <div className="ml-auto">
              <TacticalButton type="submit" variant="primary" size="md">
                SAVE SYSTEM PARAMETERS
              </TacticalButton>
            </div>
          </div>
        </form>
      </CornerPanel>

      {/* 2. FULL JSON BACKUP & RESTORE ENGINE */}
      <CornerPanel
        variant="blue"
        title="Full Database Vault Export & Restore"
        subtitle="Binary Base64 round-trip serialization"
        icon={Database}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Export Side */}
          <div className="p-4 bg-obsidian-void border border-tactical-border rounded-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-solo-blue font-display font-bold text-xs uppercase tracking-wider">
                <Download className="w-4 h-4" />
                <span>FULL SYSTEM JSON EXPORT</span>
              </div>
              <p className="text-[11px] font-mono text-ayanokoji-muted mt-2 leading-relaxed">
                Serializes all system settings, biometric checkpoints, custom exercises, workout history logs, completed directives, and binary progress photos (converted to Base64) into a single encrypted-ready JSON envelope.
              </p>
            </div>

            <div className="pt-2">
              <TacticalButton
                variant="primary"
                size="md"
                icon={Download}
                onClick={handleExportBackup}
                loading={isExporting}
                className="w-full"
              >
                GENERATE & DOWNLOAD BACKUP JSON
              </TacticalButton>
            </div>
          </div>

          {/* Import / Restore Side */}
          <div className="p-4 bg-obsidian-void border border-tactical-border rounded-sm space-y-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-white font-display font-bold text-xs uppercase tracking-wider">
                <Upload className="w-4 h-4 text-solo-blue" />
                <span>VALIDATED SYSTEM RESTORE</span>
              </div>
              <p className="text-[11px] font-mono text-ayanokoji-muted mt-2 leading-relaxed">
                Parses, validates schema types, decodes Base64 binaries back to Blobs, and commits inside an atomic IndexedDB transaction. Corrupted JSON files are rejected without harming existing records.
              </p>

              {/* Mode Selector */}
              <div className="mt-3 flex items-center gap-4 text-xs font-mono">
                <label className="flex items-center gap-1.5 cursor-pointer text-ayanokoji-slate">
                  <input
                    type="radio"
                    name="importMode"
                    value="replace"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="accent-solo-blue"
                  />
                  <span>REPLACE (Clean Wipe & Load)</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer text-ayanokoji-slate">
                  <input
                    type="radio"
                    name="importMode"
                    value="merge"
                    checked={importMode === 'merge'}
                    onChange={() => setImportMode('merge')}
                    className="accent-solo-blue"
                  />
                  <span>MERGE (Upsert)</span>
                </label>
              </div>
            </div>

            <div className="pt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportFile}
                accept=".json,application/json"
                className="hidden"
              />
              <TacticalButton
                variant="secondary"
                size="md"
                icon={Upload}
                onClick={() => fileInputRef.current?.click()}
                loading={isImporting}
                className="w-full"
              >
                SELECT & RESTORE BACKUP JSON
              </TacticalButton>
            </div>
          </div>
        </div>
      </CornerPanel>

      {/* 3. DANGER ZONE: DATA PURGE */}
      <CornerPanel
        variant="crimson"
        title="Danger Protocol // Local Data Purge"
        subtitle="Permanent erasure of all local records"
        icon={ShieldAlert}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-red-950/20 border border-red-900/40 rounded-sm">
          <div className="space-y-1">
            <h4 className="text-xs font-display font-bold uppercase text-white tracking-wider">
              PURGE ALL LOCAL SYSTEM DATA
            </h4>
            <p className="text-[11px] font-mono text-ayanokoji-muted leading-relaxed max-w-xl">
              Permanently wipes all 6 IndexedDB tables (workouts, biometric logs, photos, custom drills, directives, and system settings). This action cannot be reversed without a prior JSON export file.
            </p>
          </div>

          <TacticalButton
            variant="danger"
            size="md"
            icon={Trash2}
            onClick={() => setIsPurgeDialogOpen(true)}
            className="shrink-0"
          >
            PURGE ALL DATA
          </TacticalButton>
        </div>
      </CornerPanel>

      {/* PURGE CONFIRMATION MODAL */}
      <ConfirmDialog
        isOpen={isPurgeDialogOpen}
        onClose={() => setIsPurgeDialogOpen(false)}
        onConfirm={handlePurgeAllData}
        title="DANGER: CONFIRM COMPLETE DATA PURGE"
        message="Are you absolutely sure you want to permanently erase ALL workouts, biometric measurements, photo vault images, and directives? Your local database will be completely reset."
        confirmLabel="YES, PERMANENTLY PURGE DATABASE"
        cancelLabel="ABORT OPERATION"
        variant="danger"
        loading={isPurging}
      />
    </div>
  );
};
