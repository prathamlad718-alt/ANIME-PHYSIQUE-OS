import React from 'react';
import clsx from 'clsx';

interface MetricBadgeProps {
  label: string;
  variant?: 'blue' | 'crimson' | 'emerald' | 'amber' | 'slate';
  size?: 'sm' | 'md';
  icon?: React.ComponentType<{ className?: string }>;
}

export const MetricBadge: React.FC<MetricBadgeProps> = ({
  label,
  variant = 'blue',
  size = 'sm',
  icon: Icon,
}) => {
  const colorStyles = {
    blue: 'border-solo-blue/50 text-solo-blue bg-solo-blue/10',
    crimson: 'border-combat-crimson/50 text-combat-crimson bg-combat-crimson/10',
    emerald: 'border-status-success/50 text-status-success bg-status-success/10',
    amber: 'border-status-warning/50 text-status-warning bg-status-warning/10',
    slate: 'border-ayanokoji-muted/50 text-ayanokoji-secondary bg-ayanokoji-muted/10',
  }[variant];

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold border rounded-sm',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2.5 py-1',
        colorStyles
      )}
    >
      {Icon && <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      {label}
    </span>
  );
};
