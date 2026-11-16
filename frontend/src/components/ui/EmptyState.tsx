import React from 'react';
import { FolderOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ElementType | React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = '',
}) => {
  const renderIcon = () => {
    if (!icon) return <FolderOpen className="w-6 h-6" />;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || typeof icon === 'object') {
      const IconComponent = icon as React.ElementType;
      return <IconComponent className="w-6 h-6" />;
    }
    return <FolderOpen className="w-6 h-6" />;
  };

  return (
    <div className={`py-14 p-6 bg-white rounded-2xl border border-[var(--role-border)] text-center max-w-md mx-auto space-y-4 card-elevation ${className}`}>
      <div className="w-12 h-12 rounded-2xl bg-[var(--role-soft)] border border-[var(--role-soft-border)] text-[var(--role-primary)] flex items-center justify-center mx-auto shadow-xs">
        {renderIcon()}
      </div>
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-[var(--role-text)] tracking-tight">{title}</h4>
        <p className="text-xs text-[var(--role-text-muted)] leading-relaxed max-w-sm mx-auto">{description}</p>
      </div>
      {actionLabel && onAction && (
        <Button size="sm" variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
