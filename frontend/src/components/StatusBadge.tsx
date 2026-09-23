import React from 'react';

interface StatusBadgeProps {
  status: 'weak' | 'needs_practice' | 'strong' | 'not_started' | string;
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'strong':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          Strong
        </span>
      );
    case 'needs_practice':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-950/60 text-amber-300 border border-amber-800/60">
          Needs practice
        </span>
      );
    case 'weak':
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-950/60 text-rose-300 border border-rose-800/60">
          Weak
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-zinc-800/80 text-zinc-400 border border-zinc-700/60">
          Not started
        </span>
      );
  }
};
