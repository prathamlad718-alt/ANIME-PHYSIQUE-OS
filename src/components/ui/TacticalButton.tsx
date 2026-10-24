import React from 'react';
import clsx from 'clsx';

export interface TacticalButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'crimson' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

export const TacticalButton: React.FC<TacticalButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled,
  loading = false,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-display font-semibold uppercase tracking-wider transition-all duration-150 focus:outline-none focus:ring-1 disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-sm';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2 gap-2',
    lg: 'text-sm sm:text-base px-5 py-2.5 gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-solo-blue/15 border border-solo-blue text-solo-blue hover:bg-solo-blue/25 focus:ring-solo-blue shadow-hud-blue',
    crimson:
      'bg-combat-crimson/15 border border-combat-crimson text-combat-crimson hover:bg-combat-crimson/25 focus:ring-combat-crimson shadow-hud-crimson',
    secondary:
      'bg-obsidian-elevated border border-tactical-border text-ayanokoji-slate hover:border-ayanokoji-secondary/60 hover:text-white focus:ring-ayanokoji-secondary',
    ghost:
      'bg-transparent border border-transparent text-ayanokoji-secondary hover:text-ayanokoji-slate hover:bg-obsidian-elevated/40 focus:ring-ayanokoji-muted',
    danger:
      'bg-red-950/40 border border-red-600/70 text-red-400 hover:bg-red-900/60 hover:text-red-300 focus:ring-red-500',
  }[variant];

  return (
    <button
      className={clsx(baseStyles, sizeStyles, variantStyles, className)}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && <Icon className={clsx(size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4')} />}
      {children}
    </button>
  );
};
