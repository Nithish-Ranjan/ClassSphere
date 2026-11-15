import React from 'react';

interface LoadingStateProps {
  label?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  label = 'Loading operational telemetry...',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-7 h-7 border-3',
    lg: 'w-9 h-9 border-3',
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`} role="status" aria-live="polite">
      <div
        className={`${sizeClasses[size]} border-teal border-t-transparent rounded-full animate-spin`}
        aria-hidden="true"
      />
      {label && <p className="mt-3 text-xs font-medium text-textSecondary tracking-wide">{label}</p>}
      <span className="sr-only">Loading</span>
    </div>
  );
};
