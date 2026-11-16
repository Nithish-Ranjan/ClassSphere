import React from 'react';

export const LoadingState: React.FC<{ label?: string }> = ({
  label = 'Loading institutional records...',
}) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-[var(--role-soft)] border border-[var(--role-soft-border)] flex items-center justify-center animate-pulse">
          <div className="w-6 h-6 border-3 border-[var(--role-primary)] border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-sm font-bold text-[var(--role-text)] tracking-tight">{label}</div>
        <p className="text-xs text-[var(--role-text-muted)]">Connecting to institutional backend telemetry...</p>
      </div>
    </div>
  );
};
