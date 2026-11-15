import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) => {
  return (
    <div className={`p-8 sm:p-12 text-center rounded-xl border border-dashed border-slate-200 bg-white ${className}`}>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400 border border-slate-100">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-textPrimary tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-textSecondary max-w-sm mx-auto leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <div className="mt-4">
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-teal text-white hover:bg-teal-hover transition-colors shadow-subtle cursor-pointer focus-ring"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
};
