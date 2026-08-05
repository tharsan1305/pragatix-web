import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message = 'No activities available for this stage yet.',
}) => {
  return (
    <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
        <Inbox className="w-8 h-8" />
      </div>
      <p className="text-sm font-semibold text-slate-500 max-w-xs leading-relaxed">
        {message}
      </p>
    </div>
  );
};

export default EmptyState;
