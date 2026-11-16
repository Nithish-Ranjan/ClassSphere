import React from 'react';

export interface StatusIndicatorProps {
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'SIMULATION' | 'CONNECTED';
  label?: string;
  size?: 'sm' | 'md';
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  size = 'md',
  pulse = true,
}) => {
  const configs = {
    ONLINE: {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      defaultLabel: 'Online',
    },
    OFFLINE: {
      dot: 'bg-slate-400',
      badge: 'bg-slate-100 text-slate-600 border-slate-200',
      defaultLabel: 'Offline',
    },
    DEGRADED: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      defaultLabel: 'Degraded',
    },
    SIMULATION: {
      dot: 'bg-amber-500',
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      defaultLabel: 'SIMULATION MODE',
    },
    CONNECTED: {
      dot: 'bg-teal-500',
      badge: 'bg-teal-50 text-teal-800 border-teal-200',
      defaultLabel: 'CONNECTED CCTV',
    },
  }[status] || {
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200',
    defaultLabel: status,
  };

  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';
  const textClass = size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold uppercase tracking-wider font-mono ${configs.badge} ${textClass}`}
    >
      <span
        className={`rounded-full ${dotSize} ${configs.dot} ${pulse ? 'animate-pulse' : ''}`}
        aria-hidden="true"
      />
      <span>{label || configs.defaultLabel}</span>
    </span>
  );
};
