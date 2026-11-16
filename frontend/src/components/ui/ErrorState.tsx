import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export const ErrorState: React.FC<{
  message?: string;
  onRetry?: () => void;
}> = ({ message = 'Failed to load data from institutional API.', onRetry }) => {
  return (
    <div className="py-14 p-6 bg-rose-50/60 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-xs">
        <AlertCircle className="w-6 h-6" />
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-rose-900 tracking-tight">System Request Interrupted</h4>
        <p className="text-xs text-rose-700 leading-relaxed max-w-sm mx-auto">{message}</p>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          className="border-rose-300 text-rose-800 hover:bg-rose-100/70"
        >
          Retry Request
        </Button>
      )}
    </div>
  );
};
