import React from 'react';

export interface TimelineItem {
  id: string | number;
  time: string;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  icon?: React.ReactNode;
  isCompleted?: boolean;
  isActive?: boolean;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  if (items.length === 0) {
    return <div className="py-6 text-center text-xs text-[var(--role-text-muted)]">No timeline events recorded.</div>;
  }

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 ${className}`}>
      {items.map((item) => (
        <div key={item.id} className="relative group">
          {/* Dot */}
          <div
            className={`absolute -left-6 top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center transition-transform group-hover:scale-110 ${
              item.isActive
                ? 'border-[var(--role-primary)] ring-4 ring-[var(--role-ring)]'
                : item.isCompleted
                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                : 'border-slate-300'
            }`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                item.isActive
                  ? 'bg-[var(--role-primary)] animate-pulse'
                  : item.isCompleted
                  ? 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 card-elevation text-xs space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[var(--role-text)] tracking-tight">
                {item.title}
              </span>
              <div className="flex items-center gap-2">
                {item.badge}
                <span className="font-mono text-[10px] text-[var(--role-text-muted)]">{item.time}</span>
              </div>
            </div>
            {item.description && (
              <p className="text-[11px] text-[var(--role-text-muted)] leading-relaxed">
                {item.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
