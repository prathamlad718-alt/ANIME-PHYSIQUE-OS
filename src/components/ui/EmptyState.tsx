import React from 'react';
import { TacticalButton } from './TacticalButton';
import { ShieldAlert } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: 'primary' | 'crimson';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = ShieldAlert,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center border border-dashed border-tactical-border/80 bg-obsidian-charcoal/40 rounded-sm">
      <div className="w-12 h-12 flex items-center justify-center border border-tactical-border bg-obsidian-elevated mb-3.5">
        <Icon className="w-6 h-6 text-ayanokoji-muted" />
      </div>
      <h4 className="font-display font-semibold uppercase text-sm tracking-wider text-ayanokoji-slate">
        {title}
      </h4>
      <p className="text-xs text-ayanokoji-muted max-w-sm mt-1 mb-5 font-mono">
        {description}
      </p>
      {actionLabel && onAction && (
        <TacticalButton variant={actionVariant} size="sm" onClick={onAction}>
          {actionLabel}
        </TacticalButton>
      )}
    </div>
  );
};
