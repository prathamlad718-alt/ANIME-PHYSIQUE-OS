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
      ? 'border-combat-crimson/40 hover:border-combat-crimson/70'
      : variant === 'blue'
      ? 'border-solo-blue/40 hover:border-solo-blue/70'
      : 'border-tactical-border hover:border-ayanokoji-muted/50';

  return (
    <div
      className={clsx(
        'corner-bracket border transition-colors duration-200 relative',
        bracketTl,
        bracketBr,
        borderColor,
        elevated ? 'bg-obsidian-elevated' : 'bg-obsidian-charcoal',
        'p-4 sm:p-5',
        className
      )}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-tactical-border/60">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <Icon
                className={clsx(
                  'w-4 h-4',
                  variant === 'crimson'
                    ? 'text-combat-crimson'
                    : variant === 'blue'
                    ? 'text-solo-blue'
                    : 'text-ayanokoji-secondary'
                )}
              />
            )}
            <div>
              {title && (
                <h3 className="font-display font-semibold tracking-wider uppercase text-xs sm:text-sm text-ayanokoji-slate">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-[11px] text-ayanokoji-muted tracking-wide font-mono">
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
