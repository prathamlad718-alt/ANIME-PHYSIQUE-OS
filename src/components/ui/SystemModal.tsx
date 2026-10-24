import React, { useEffect } from 'react';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
  variant?: 'blue' | 'crimson';
}

export const SystemModal: React.FC<SystemModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  variant = 'blue',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
  }[maxWidth];

  const borderColor =
    variant === 'crimson'
      ? 'border-combat-crimson/50'
      : 'border-solo-blue/50';

  const glowShadow =
    variant === 'crimson' ? 'shadow-hud-crimson' : 'shadow-hud-blue';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-obsidian-void/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="fixed inset-0 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={clsx(
          'relative w-full border bg-obsidian-charcoal text-ayanokoji-slate z-10 my-8 shadow-2xl rounded-sm',
          borderColor,
          glowShadow,
          maxWidthStyles
        )}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-tactical-border/70 bg-obsidian-elevated">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={clsx(
                  'w-1.5 h-3.5',
                  variant === 'crimson' ? 'bg-combat-crimson' : 'bg-solo-blue'
                )}
              />
              <h2 className="font-display font-bold uppercase tracking-wider text-sm sm:text-base text-white">
                {title}
              </h2>
            </div>
            {subtitle && (
              <p className="text-xs text-ayanokoji-muted font-mono mt-0.5 ml-3.5">
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-ayanokoji-secondary hover:text-white p-1 rounded-sm hover:bg-obsidian-charcoal transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(85vh-100px)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
