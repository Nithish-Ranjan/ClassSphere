import React from 'react';

export type BadgeVariant =
  | 'PRESENT'
  | 'ABSENT'
  | 'LATE'
  | 'MANUAL_REVIEW'
  | 'PENDING_VERIFICATION'
  | 'ACTIVE'
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'SIMULATION'
  | 'CONNECTED'
  | 'ESCALATED'
  | 'RESOLVED'
  | 'PENDING'
  | 'DEFAULT';

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  variant,
  size = 'sm',
  showDot = true,
}) => {
  const norm = (variant || status || 'DEFAULT').toUpperCase().replace(/[\s-]/g, '_');

  const styles: Record<string, { bg: string; text: string; border: string; dot: string; label?: string }> = {
    PRESENT: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    ABSENT: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
    },
    LATE: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    MANUAL_REVIEW: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Manual Review',
    },
    PENDING_VERIFICATION: {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Pending Verification',
    },
    ACTIVE: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500 animate-pulse',
    },
    SCHEDULED: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
    COMPLETED: {
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-500',
    },
    SIMULATION: {
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      dot: 'bg-amber-500',
      label: 'MODE: SIMULATION',
    },
    CONNECTED: {
      bg: 'bg-teal-50',
      text: 'text-teal-800',
      border: 'border-teal-200',
      dot: 'bg-teal',
      label: 'MODE: CONNECTED',
    },
    ESCALATED: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500 animate-pulse',
      label: 'Escalated to HOD',
    },
    RESOLVED: {
      bg: 'bg-slate-50',
      text: 'text-slate-700',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
      label: 'Resolved',
    },
    DEFAULT: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const current = styles[norm] || styles.DEFAULT;
  const displayLabel = current.label || status.replace(/_/g, ' ');

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeClasses}`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} aria-hidden="true" />}
      <span>{displayLabel}</span>
    </span>
  );
};
