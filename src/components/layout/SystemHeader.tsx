import React from 'react';
import { UserSettings, SystemRankInfo } from '../../domain/types';
import { calculateJourneyDayCount } from '../../domain/math';
import { Shield, Zap, Calendar, HeartHandshake } from 'lucide-react';
import { TacticalButton } from '../ui/TacticalButton';

interface SystemHeaderProps {
  settings: UserSettings | null;
  rankInfo: SystemRankInfo;
  onLogRecoveryDay: () => void;
  onQuickWorkout: () => void;
}

export const SystemHeader: React.FC<SystemHeaderProps> = ({
  settings,
  rankInfo,
  onLogRecoveryDay,
  onQuickWorkout,
}) => {
  const dayCount = settings
    ? calculateJourneyDayCount(settings.journeyStartDate)
    : 1;

  return (
    <header className="border-b border-tactical-border/80 bg-obsidian-charcoal/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: System Status & Arc */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center border border-solo-blue/60 bg-solo-blue/10 text-solo-blue shadow-hud-blue rounded-sm">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold uppercase tracking-widest text-xs sm:text-sm text-white">
                PROJECT AWAKENING
              </span>
              <span className="px-1.5 py-0.2 text-[9px] font-mono tracking-wider bg-tactical-border/60 text-solo-blue uppercase border border-solo-blue/30 rounded-sm">
                ONLINE
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono text-ayanokoji-muted mt-0.5">
              <span className="text-solo-blue font-semibold">
                {settings?.currentArcName || 'FOUNDATION ARC'}
              </span>
              <span className="text-tactical-border">|</span>
              <span className="flex items-center gap-1 text-ayanokoji-secondary">
                <Calendar className="w-3 h-3 text-ayanokoji-muted" />
                DAY <span className="text-white font-bold tabular-nums">{dayCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: Rank Progress & Quick Actions */}
        <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-4">
          {/* Rank & XP Status Box */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 border border-tactical-border bg-obsidian-elevated rounded-sm">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-combat-crimson" />
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-display font-bold text-white tracking-wider">
                    {rankInfo.rank}-RANK
                  </span>
                  <span className="text-[10px] font-mono text-combat-crimson font-semibold">
                    LVL {rankInfo.level}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-ayanokoji-muted">
                  <span className="tabular-nums text-ayanokoji-slate">{rankInfo.currentXP}</span> /{' '}
                  <span className="tabular-nums">{rankInfo.nextRankXP} XP</span>
                </div>
              </div>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-16 h-1.5 bg-obsidian-void border border-tactical-border/60 rounded-sm overflow-hidden hidden sm:block">
              <div
                className="h-full bg-combat-crimson transition-all duration-300"
                style={{ width: `${rankInfo.progressPercent}%` }}
              />
            </div>
          </div>

          {/* Tactical Action Buttons */}
          <div className="flex items-center gap-2">
            <TacticalButton
              variant="secondary"
              size="sm"
              icon={HeartHandshake}
              onClick={onLogRecoveryDay}
              title="Log Recovery / Rest Day (Mindfulness protocol without penalty)"
            >
              <span className="hidden sm:inline">RECOVERY DAY</span>
              <span className="sm:hidden">REST</span>
            </TacticalButton>
            <TacticalButton
              variant="crimson"
              size="sm"
              icon={Zap}
              onClick={onQuickWorkout}
            >
              <span className="hidden sm:inline">LOG WORKOUT</span>
              <span className="sm:hidden">TRAIN</span>
            </TacticalButton>
          </div>
        </div>
      </div>
    </header>
  );
};
