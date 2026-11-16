import React from 'react';

export interface MetricDisplayProps {
  label: string;
  value: string | number;
  subvalue?: string;
  trend?: {
    value: string | number;
    positive?: boolean;
    label?: string;
  };
  icon?: React.ReactNode;
  progressPct?: number;
  progressTarget?: string;
  highlight?: boolean;
  className?: string;
}

export const MetricDisplay: React.FC<MetricDisplayProps> = ({
  label,
  value,
  subvalue,
  trend,
  icon,
  progressPct,
  progressTarget,
  highlight = false,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[var(--role-border)] p-5 card-elevation relative overflow-hidden transition-all duration-200 hover:shadow-md ${
        highlight ? 'ring-1 ring-[var(--role-primary)]/30' : ''
      } ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--role-text-muted)] block">
            {label}
          </span>
          <div className="text-3xl font-bold tracking-tight text-[var(--role-text)]">
            {value}
          </div>
        </div>
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[var(--role-soft)] border border-[var(--role-soft-border)] text-[var(--role-primary)] flex items-center justify-center flex-shrink-0 shadow-xs">
            {icon}
          </div>
        )}
      </div>

      {progressPct !== undefined && (
        <div className="mt-3.5 space-y-1.5">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className="h-full rounded-full transition-all duration-500 bg-[var(--role-primary)]"
              style={{ width: `${Math.min(Math.max(progressPct, 0), 100)}%` }}
            />
          </div>
          {progressTarget && (
            <div className="flex justify-between items-center text-[11px] font-mono text-[var(--role-text-muted)]">
              <span>{progressPct}% achieved</span>
              <span>Target: {progressTarget}</span>
            </div>
          )}
        </div>
      )}

      {(subvalue || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-[var(--role-text-muted)]">
          {subvalue && <span className="truncate">{subvalue}</span>}
          {trend && (
            <span
              className={`font-semibold inline-flex items-center gap-0.5 ml-auto ${
                trend.positive ? 'text-emerald-600' : 'text-red-600'
              }`}
            >
              {trend.positive ? '↑' : '↓'} {trend.value}
              {trend.label && <span className="text-slate-400 font-normal ml-1">{trend.label}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
