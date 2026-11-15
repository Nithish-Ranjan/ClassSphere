import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to Load Data',
  message = 'An unexpected network or service error occurred. Please retry.',
  onRetry,
  className = '',
}) => {
  return (
    <div
      className={`rounded-xl border border-red-200 bg-red-50/60 p-6 text-center ${className}`}
      role="alert"
    >
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-brandDanger">
        <AlertCircle className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-textPrimary tracking-tight">{title}</h3>
      <p className="mt-1 text-xs text-textSecondary max-w-md mx-auto leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-red-200 text-brandDanger hover:bg-red-50 transition-colors shadow-subtle cursor-pointer focus-ring"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};
