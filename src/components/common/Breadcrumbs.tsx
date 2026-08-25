import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
  isActive?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  onHomeClick?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  className = '',
  onHomeClick,
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 type-caption text-text-secondary ${className}`}>
      {onHomeClick && (
        <button
          onClick={onHomeClick}
          className="flex items-center hover:text-text-primary transition-colors cursor-pointer p-1 rounded hover:bg-bg"
          aria-label="Go to Home"
        >
          <Home className="w-3.5 h-3.5" />
        </button>
      )}

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1 || item.isActive;
        return (
          <React.Fragment key={idx}>
            {(idx > 0 || onHomeClick) && (
              <ChevronRight className="w-3.5 h-3.5 text-text-muted shrink-0" />
            )}
            {isLast || !item.onClick ? (
              <span className={`font-bold ${isLast ? 'text-text-primary' : 'text-text-secondary'}`}>
                {item.label}
              </span>
            ) : (
              <button
                onClick={item.onClick}
                className="hover:text-text-primary hover:underline transition-colors cursor-pointer truncate max-w-xs font-medium"
              >
                {item.label}
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
