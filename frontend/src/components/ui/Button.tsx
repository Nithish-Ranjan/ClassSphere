import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'px-2.5 py-1 text-xs gap-1 rounded-md',
    sm: 'px-3 py-1.5 text-xs gap-1.5 rounded-lg',
    md: 'px-4 py-2.5 text-sm gap-2 rounded-lg',
    lg: 'px-5 py-3 text-base gap-2.5 rounded-xl',
  }[size];

  const variantClasses = {
    primary:
      'bg-[var(--role-primary)] text-white hover:bg-[var(--role-primary-strong)] shadow-xs border border-transparent font-semibold active:translate-y-px',
    secondary:
      'bg-[var(--role-soft)] text-[var(--role-primary-strong)] hover:bg-[var(--role-primary-light)]/20 border border-[var(--role-soft-border)] font-semibold',
    outline:
      'bg-transparent text-[var(--role-text)] hover:bg-[var(--role-soft)] border border-[var(--role-border)] hover:border-[var(--role-primary)] font-medium',
    ghost:
      'bg-transparent text-[var(--role-text-muted)] hover:text-[var(--role-text)] hover:bg-[var(--role-soft)] font-medium',
    danger:
      'bg-red-600 text-white hover:bg-red-700 shadow-xs border border-transparent font-semibold',
    accent:
      'bg-[var(--role-accent)] text-white hover:brightness-110 shadow-xs border border-transparent font-semibold',
  }[variant];

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 focus-ring cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
      ) : (
        leftIcon && <span className="flex-shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
    </button>
  );
};
