import React from 'react';
import { SystemModal } from './SystemModal';
import { TacticalButton } from './TacticalButton';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'CONFIRM DIRECTIVE',
  cancelLabel = 'ABORT',
  variant = 'danger',
  loading = false,
}) => {
  return (
    <SystemModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      variant={variant === 'danger' ? 'crimson' : 'blue'}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-red-950/20 border border-red-900/40 p-3 rounded-sm">
          <AlertTriangle className="w-5 h-5 text-combat-crimson shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-ayanokoji-slate leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <TacticalButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={loading}
          >
            {cancelLabel}
          </TacticalButton>
          <TacticalButton
            variant={variant === 'danger' ? 'danger' : 'crimson'}
            size="sm"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </TacticalButton>
        </div>
      </div>
    </SystemModal>
  );
};
