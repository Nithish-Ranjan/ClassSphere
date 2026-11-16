import React from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyState?: React.ReactNode;
  isLoading?: boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyState,
  isLoading = false,
  onRowClick,
  className = '',
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-[var(--role-primary)] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-[var(--role-text-muted)] font-medium">Loading records...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return emptyState ? (
      <>{emptyState}</>
    ) : (
      <div className="py-12 text-center text-xs text-[var(--role-text-muted)]">
        No records found.
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50/80 text-[var(--role-text-muted)] font-semibold uppercase tracking-wider text-[10px]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-3 px-4 ${
                  col.align === 'center'
                    ? 'text-center'
                    : col.align === 'right'
                    ? 'text-right'
                    : 'text-left'
                } ${col.className || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, idx) => (
            <tr
              key={keyExtractor(row, idx)}
              onClick={() => onRowClick?.(row)}
              className={`transition-colors ${
                onRowClick ? 'cursor-pointer hover:bg-[var(--role-soft)]/50' : 'hover:bg-slate-50/60'
              }`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`py-3.5 px-4 text-[var(--role-text)] ${
                    col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                      ? 'text-right'
                      : 'text-left'
                  } ${col.className || ''}`}
                >
                  {col.render ? col.render(row, idx) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
