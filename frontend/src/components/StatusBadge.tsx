import React from 'react';

interface StatusBadgeProps {
  status: 'weak' | 'needs_practice' | 'strong' | 'not_started' | string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, showIcon = true }) => {
  switch (status) {
    case 'strong':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-700/60 shadow-xs"
          role="status"
          aria-label="Status: Strong Mastery"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" aria-hidden="true" />}
          Strong
        </span>
      );
    case 'needs_practice':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-950/70 text-amber-300 border border-amber-700/60 shadow-xs"
          role="status"
          aria-label="Status: Needs Practice"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" aria-hidden="true" />}
          Needs practice
        </span>
      );
    case 'weak':
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-950/70 text-rose-300 border border-rose-700/60 shadow-xs"
          role="status"
          aria-label="Status: Weak"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0 animate-pulse" aria-hidden="true" />}
          Weak
        </span>
      );
    default:
      return (
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900/90 text-zinc-400 border border-zinc-700/60 shadow-xs"
          role="status"
          aria-label="Status: Not Started"
        >
          {showIcon && <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 shrink-0" aria-hidden="true" />}
          Not started
        </span>
      );
  }
};
