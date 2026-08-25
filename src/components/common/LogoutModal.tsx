import { useEffect } from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function LogoutModal({
  open,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: LogoutModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-text-primary/40 backdrop-blur-xs transition-opacity"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative w-full max-w-md bg-card text-text-primary rounded-lg shadow-2xl overflow-hidden border border-border p-6 sm:p-7 transform transition-all animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-5 right-5 p-2 text-text-muted hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 bg-accent-tint text-accent rounded-lg flex items-center justify-center mb-4 border border-accent/30 shadow-none">
            <LogOut className="w-7 h-7" />
          </div>

          <h2 id="logout-modal-title" className="type-h4 font-bold text-text-primary">
            Confirm Logout
          </h2>

          <p className="type-body-sm text-text-secondary mt-2 mb-6 max-w-xs font-medium">
            Are you sure you want to sign out? Your active session will end.
          </p>

          <div className="grid grid-cols-2 gap-3 w-full pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="type-btn w-full py-2.5 px-4 bg-bg hover:bg-border text-text-primary border border-border rounded-lg transition-colors cursor-pointer font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="type-btn w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-card rounded-lg transition-colors shadow-none disabled:opacity-50 cursor-pointer font-bold"
            >
              {isSubmitting ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
