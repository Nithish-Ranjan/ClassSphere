import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  accentTop?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  accentTop = false,
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-[var(--role-border)] card-elevation relative overflow-hidden ${
        hover ? 'card-elevation-hover' : ''
      } ${accentTop ? 'before:absolute before:top-0 before:left-0 before:right-0 before:h-1 before:bg-[var(--role-primary)]' : ''} ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, badge, action, className = '' }) => {
  return (
    <div
      className={`p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}
    >
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-[var(--role-text)] tracking-tight">{title}</h3>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs text-[var(--role-text-muted)] mt-0.5 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => {
  return (
    <div
      className={`p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 rounded-b-xl flex items-center justify-between text-xs text-[var(--role-text-muted)] ${className}`}
    >
      {children}
    </div>
  );
};
