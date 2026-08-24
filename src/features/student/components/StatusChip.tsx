import React from 'react';
import type { StageStatus } from '../types/activity';

interface StatusChipProps {
  status: StageStatus | string;
  size?: 'sm' | 'md';
}

export const StatusChip: React.FC<StatusChipProps> = ({ status, size = 'md' }) => {
  const normalized = (status || '').toUpperCase();

  let styles = 'bg-slate-100 text-slate-600 border-slate-200';
  let label = status;

  if (normalized === 'COMPLETED') {
    styles = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    label = 'COMPLETED';
  } else if (normalized === 'ACTIVE') {
    styles = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    label = 'ACTIVE';
  } else if (normalized === 'LOCKED') {
    styles = 'bg-slate-100 text-slate-500 border-slate-200';
    label = 'LOCKED';
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-[10px] font-bold' 
    : 'px-2.5 py-1 type-caption font-bold';

  return (
    <span className={`inline-flex items-center rounded-full border ${styles} ${sizeClasses}`}>
      {label}
    </span>
  );
};

export default StatusChip;
