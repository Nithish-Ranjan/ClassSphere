import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold uppercase tracking-wider text-[var(--role-text-muted)] mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full py-2.5 px-3.5 text-sm rounded-lg border bg-white transition-all outline-none cursor-pointer ${
            error
              ? 'border-red-400 focus:border-red-600 focus:ring-2 focus:ring-red-100 text-red-900'
              : 'border-[var(--role-border)] text-[var(--role-text)] focus:border-[var(--role-primary)] focus:ring-2 focus:ring-[var(--role-ring)]'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1 text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1 text-xs text-[var(--role-text-muted)]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
