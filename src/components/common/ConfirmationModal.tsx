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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 transform transition-all scale-100">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDangerous ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="type-h5 text-slate-900">{title}</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="mt-4 type-body-sm text-slate-600">
            {description}
          </p>
        </div>

        <div className="bg-slate-50 px-6 py-4 flex justify-end space-x-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="type-btn px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition-colors shadow-sm"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`type-btn px-5 py-2 text-white rounded-xl transition-colors shadow-sm ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-4 focus:ring-rose-200'
                : 'bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
