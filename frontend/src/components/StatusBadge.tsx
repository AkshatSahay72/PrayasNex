import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, Sparkles } from 'lucide-react';

interface StatusBadgeProps {
  status: 'weak' | 'needs_practice' | 'strong' | 'not_started' | string;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  switch (status) {
    case 'weak':
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses[size]}`}>
          <AlertTriangle className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Weak (&lt; 50%)</span>
        </span>
      );
    case 'needs_practice':
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses[size]}`}>
          <Clock className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Needs Practice (50-79%)</span>
        </span>
      );
    case 'strong':
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses[size]}`}>
          <CheckCircle2 className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Mastered (&ge; 80%)</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses[size]}`}>
          <Sparkles className={size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
          <span>Not Started</span>
        </span>
      );
  }
};
