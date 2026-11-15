import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 card-elevation ${
        hover ? 'card-elevation-hover' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, action, className = '' }) => {
  return (
    <div className={`p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${className}`}>
      <div>
        <h3 className="text-base font-semibold text-textPrimary tracking-tight">{title}</h3>
        {subtitle && <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
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
    <div className={`p-4 sm:p-5 bg-slate-50/60 border-t border-slate-100 rounded-b-xl flex items-center justify-between ${className}`}>
      {children}
    </div>
  );
};
