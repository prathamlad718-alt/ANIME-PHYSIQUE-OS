import React from 'react';
import clsx from 'clsx';
import {
  LayoutDashboard,
  Activity,
  Flame,
  Camera,
  LineChart,
  ShieldCheck,
  Settings,
  Cpu,
  Radio,
} from 'lucide-react';

export type NavTabId =
  | 'dashboard'
  | 'measurements'
  | 'workouts'
  | 'photos'
  | 'analytics'
  | 'quests'
  | 'settings';

interface DesktopSidebarProps {
  currentTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  uncompletedQuestsCount: number;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  currentTab,
  onSelectTab,
  uncompletedQuestsCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTabId,
      label: 'SYSTEM HUD',
      sublabel: 'Aura & Status Overviews',
      icon: LayoutDashboard,
      code: 'MOD-A',
    },
    {
      id: 'measurements' as NavTabId,
      label: 'BIOMETRICS',
      sublabel: 'Anatomical Deltas & Sites',
      icon: Activity,
      code: 'MOD-B',
    },
    {
      id: 'workouts' as NavTabId,
      label: 'TRAINING & PRS',
      sublabel: 'Combat & Conditioning',
      icon: Flame,
      code: 'MOD-C',
    },
    {
      id: 'photos' as NavTabId,
      label: 'PHOTO VAULT',
      sublabel: 'Private Local Visuals',
      icon: Camera,
      code: 'MOD-D',
    },
    {
      id: 'analytics' as NavTabId,
      label: 'TACTICAL DATA',
      sublabel: 'Cold Biometric Trajectories',
      icon: LineChart,
      code: 'MOD-E',
    },
    {
      id: 'quests' as NavTabId,
      label: 'DIRECTIVES',
      sublabel: 'Daily & Weekly Protocols',
      icon: ShieldCheck,
      badge: uncompletedQuestsCount > 0 ? uncompletedQuestsCount : undefined,
      code: 'MOD-F',
    },
    {
      id: 'settings' as NavTabId,
      label: 'CONFIG & BACKUP',
      sublabel: 'Offline Vault & Export',
      icon: Settings,
      code: 'MOD-G',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-tactical-border/80 bg-obsidian-charcoal min-h-[calc(100vh-65px)] flex flex-col justify-between p-4 hidden lg:flex select-none">
      <div className="space-y-6">
        {/* Navigation Category Label */}
        <div className="flex items-center justify-between px-2 text-[10px] font-mono tracking-widest text-ayanokoji-muted uppercase">
          <span>OPERATIONAL MODULES</span>
          <Radio className="w-3 h-3 text-solo-blue animate-pulse" />
        </div>

        {/* Links */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={clsx(
                  'w-full flex items-center justify-between p-2.5 rounded-sm transition-all duration-150 text-left group border',
                  isActive
                    ? 'border-solo-blue/70 bg-solo-blue/10 text-white shadow-hud-blue'
                    : 'border-transparent text-ayanokoji-secondary hover:text-ayanokoji-slate hover:bg-obsidian-elevated/60 hover:border-tactical-border'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'p-1.5 rounded-sm border transition-colors',
                      isActive
                        ? 'border-solo-blue bg-solo-blue/20 text-solo-blue'
                        : 'border-tactical-border bg-obsidian-void text-ayanokoji-muted group-hover:text-ayanokoji-slate'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold uppercase text-xs tracking-wider">
                        {item.label}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-ayanokoji-muted group-hover:text-ayanokoji-secondary">
                      {item.sublabel}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-combat-crimson text-white rounded-sm">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-[9px] font-mono text-ayanokoji-muted opacity-40">
                    {item.code}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer Info */}
      <div className="pt-4 border-t border-tactical-border/60">
        <div className="flex items-center gap-2.5 px-2 py-2 bg-obsidian-elevated/60 border border-tactical-border rounded-sm">
          <Cpu className="w-4 h-4 text-solo-blue shrink-0" />
          <div className="text-[10px] font-mono leading-tight">
            <span className="text-white font-semibold">STORAGE: LOCAL FIRST</span>
            <div className="text-ayanokoji-muted text-[9px]">IndexedDB Offline Engine</div>
          </div>
        </div>
      </div>
    </aside>
  );
};
