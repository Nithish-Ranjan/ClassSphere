import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';

export interface TabItem {
  name: string;
  to: string;
  icon?: React.ElementType;
  badge?: number | string;
}

export interface TabsNavProps {
  tabs: TabItem[];
  className?: string;
}

export const TabsNav: React.FC<TabsNavProps> = ({ tabs, className = '' }) => {
  const location = useLocation();

  return (
    <div className={`flex items-center gap-2 border-b border-slate-200 pb-px overflow-x-auto ${className}`}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.to;

        return (
          <NavLink
            key={tab.name}
            to={tab.to}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg border-b-2 transition-all whitespace-nowrap select-none ${
              isActive
                ? 'border-[var(--role-primary)] text-[var(--role-primary)] bg-[var(--role-soft)]/60'
                : 'border-transparent text-[var(--role-text-muted)] hover:text-[var(--role-text)] hover:bg-slate-50'
            }`}
          >
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span>{tab.name}</span>
            {tab.badge !== undefined && (
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-[var(--role-primary)] text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {tab.badge}
              </span>
            )}
          </NavLink>
        );
      })}
    </div>
  );
};
