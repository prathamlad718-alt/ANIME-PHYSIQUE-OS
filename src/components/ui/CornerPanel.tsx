import React from 'react';
import clsx from 'clsx';

interface CornerPanelProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'blue' | 'crimson' | 'neutral';
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  elevated?: boolean;
  glow?: boolean;
}

export const CornerPanel: React.FC<CornerPanelProps> = ({
  children,
  className,
  variant = 'blue',
  title,
  subtitle,
  action,
  icon: Icon,
  elevated = false,
  glow = false,
}) => {
  const bracketTl =
    variant === 'crimson'
      ? 'corner-bracket-crimson-tl'
      : variant === 'blue'
      ? 'corner-bracket-tl'
      : '';
  const bracketBr =
    variant === 'crimson'
      ? 'corner-bracket-crimson-br'
      : variant === 'blue'
      ? 'corner-bracket-br'
      : '';

  const borderColor =
    variant === 'crimson'
      ? 'border-combat-crimson/40 hover:border-combat-crimson/80'
      : variant === 'blue'
      ? 'border-solo-blue/40 hover:border-solo-blue/80'
      : 'border-tactical-border hover:border-ayanokoji-muted/60';

  const glowEffect =
    glow && variant === 'crimson'
      ? 'animate-aura-crimson'
      : glow && variant === 'blue'
      ? 'animate-aura-blue'
      : '';

  return (
    <div
      className={clsx(
        'corner-bracket border transition-all duration-200 relative rounded-sm',
        bracketTl,
        bracketBr,
        borderColor,
        elevated ? 'glass-panel-elevated' : 'glass-panel',
        glowEffect,
        'p-4 sm:p-5',
        className
      )}
    >
      {/* Micro specular edge shine */}
      <div className="absolute top-0 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

      {(title || action || Icon) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-tactical-border/60 relative">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div
                className={clsx(
                  'p-1.5 rounded-sm border',
                  variant === 'crimson'
                    ? 'border-combat-crimson/40 bg-combat-crimson/10 text-combat-crimson shadow-hud-crimson'
                    : variant === 'blue'
                    ? 'border-solo-blue/40 bg-solo-blue/10 text-solo-blue shadow-hud-blue'
                    : 'border-tactical-border bg-obsidian-elevated text-ayanokoji-secondary'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            )}
            <div>
              {title && (
                <div className="flex items-center gap-2">
                  <h3 className="font-display font-bold tracking-wider uppercase text-xs sm:text-sm text-white">
                    {title}
                  </h3>
                </div>
              )}
              {subtitle && (
                <p className="text-[10px] text-ayanokoji-muted tracking-wide font-mono mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
