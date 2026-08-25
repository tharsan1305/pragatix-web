import { Inbox } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title,
  description,
  actionText,
  onAction,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-card border border-border rounded-lg ${className}`}>
      <div className="w-14 h-14 rounded-lg bg-bg border border-border text-text-muted flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="type-h5 font-bold text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="type-body-sm text-text-secondary max-w-sm mb-5 font-medium">
          {description}
        </p>
      )}
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="type-btn px-4 py-2 bg-accent hover:bg-accent-hover text-card rounded-lg font-bold transition-colors cursor-pointer"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
