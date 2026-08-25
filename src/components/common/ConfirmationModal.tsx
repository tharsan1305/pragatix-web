import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = true,
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-text-primary/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-card text-text-primary rounded-lg w-full max-w-md shadow-2xl overflow-hidden border border-border transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDangerous ? 'bg-accent-tint text-accent border-accent/30' : 'bg-bg text-text-primary border-border'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="type-h5 font-bold text-text-primary">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-text-muted hover:text-text-primary p-1 rounded-lg hover:bg-bg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-4 type-body-sm text-text-secondary font-medium">
            {description}
          </p>
        </div>

        <div className="bg-bg px-6 py-4 flex justify-end space-x-3 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="type-btn px-4 py-2 text-text-secondary hover:text-text-primary bg-card border border-border rounded-lg hover:bg-border transition-colors shadow-none cursor-pointer font-bold"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`type-btn px-5 py-2 text-card rounded-lg transition-colors shadow-none cursor-pointer font-bold ${
              isDangerous
                ? 'bg-accent hover:bg-accent-hover'
                : 'bg-text-primary hover:bg-text-secondary text-card'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
