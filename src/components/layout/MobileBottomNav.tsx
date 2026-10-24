import React, { useState } from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Activity,
  Flame,
  ShieldCheck,
  Menu,
  Camera,
  LineChart,
  Settings,
  X,
} from 'lucide-react';
import { NavTabId } from './DesktopSidebar';

interface MobileBottomNavProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  uncompletedQuestsCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  uncompletedQuestsCount,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const primaryTabs: Array<{
    id: NavTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'HUD', icon: LayoutDashboard },
    { id: 'workouts', label: 'TRAIN', icon: Flame },
    { id: 'measurements', label: 'BIO', icon: Activity },
    {
      id: 'quests',
      label: 'QUESTS',
      icon: ShieldCheck,
      badge: uncompletedQuestsCount > 0 ? uncompletedQuestsCount : undefined,
    },
  ];

  const secondaryTabs: Array<{
    id: NavTabId;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'photos', label: 'PHOTO VAULT', sublabel: 'Private Local Photos', icon: Camera },
    { id: 'analytics', label: 'TACTICAL ANALYTICS', sublabel: 'Performance Trajectories', icon: LineChart },
    { id: 'settings', label: 'SYSTEM CONFIG', sublabel: 'Backup & Restore', icon: Settings },
  ];

  const isSecondaryActive = ['photos', 'analytics', 'settings'].includes(currentTab);

  return (
    <>
      {/* Mobile Drawer for secondary modules */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-obsidian-void/80 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-3 bg-obsidian-charcoal border border-tactical-border p-4 rounded-sm shadow-2xl z-10 animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-tactical-border/70">
              <span className="font-display font-bold uppercase text-xs tracking-wider text-solo-blue">
                TACTICAL COMMAND HUB
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-ayanokoji-muted hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {secondaryTabs.map((sec) => {
                const Icon = sec.icon;
                const active = currentTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      onSelectTab(sec.id);
                      setDrawerOpen(false);
                    }}
                    className={clsx(
                      'flex items-center gap-3 p-3 text-left border rounded-sm transition-colors',
                      active
                        ? 'border-solo-blue/70 bg-solo-blue/15 text-white'
                        : 'border-tactical-border bg-obsidian-elevated text-ayanokoji-secondary hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5 text-solo-blue" />
                    <div>
                      <div className="font-display font-bold text-xs uppercase">
                        {sec.label}
                      </div>
                      <div className="text-[10px] font-mono text-ayanokoji-muted">
                        {sec.sublabel}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 5-Slot Thumb Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-obsidian-charcoal/95 backdrop-blur-md border-t border-tactical-border/80 px-2 py-1 select-none">
        <div className="grid grid-cols-5 gap-1 items-center max-w-md mx-auto">
          {primaryTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setDrawerOpen(false);
                  onSelectTab(tab.id);
                }}
                className={clsx(
                  'flex flex-col items-center justify-center py-1.5 px-1 rounded-sm relative transition-colors',
                  isActive
                    ? 'text-solo-blue font-bold'
                    : 'text-ayanokoji-muted hover:text-ayanokoji-slate'
                )}
              >
                <div className="relative">
                  <Icon className={clsx('w-5 h-5', isActive && 'text-solo-blue drop-shadow-[0_0_8px_rgba(0,210,255,0.6)]')} />
                  {tab.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 px-1 text-[8px] font-mono font-bold bg-combat-crimson text-white rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className="text-[9px] font-display uppercase tracking-wider mt-1">
                  {tab.label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 inset-x-2 h-0.5 bg-solo-blue" />
                )}
              </button>
            );
          })}

          {/* Slot 5: Hub / More Toggle */}
          <button
            onClick={() => setDrawerOpen(!drawerOpen)}
            className={clsx(
              'flex flex-col items-center justify-center py-1.5 px-1 rounded-sm relative transition-colors',
              isSecondaryActive || drawerOpen
                ? 'text-solo-blue font-bold'
                : 'text-ayanokoji-muted hover:text-ayanokoji-slate'
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[9px] font-display uppercase tracking-wider mt-1">
              HUB
            </span>
            {isSecondaryActive && (
              <div className="absolute bottom-0 inset-x-2 h-0.5 bg-solo-blue" />
            )}
          </button>
        </div>
      </nav>
    </>
  );
};
