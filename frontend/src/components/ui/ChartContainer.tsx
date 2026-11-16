import React from 'react';

export interface ChartContainerProps {
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
  title,
  subtitle,
  badge,
  action,
  children,
  footer,
  className = '',
}) => {
  return (
    <div className={`bg-white rounded-xl border border-[var(--role-border)] card-elevation overflow-hidden ${className}`}>
      <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-[var(--role-text)] tracking-tight">{title}</h3>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p className="text-xs text-[var(--role-text-muted)] mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
        {action && <div className="flex items-center gap-2">{action}</div>}
      </div>

      <div className="p-5 sm:p-6">{children}</div>

      {footer && (
        <div className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 text-xs text-[var(--role-text-muted)] flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};
