import React from 'react';
import { NavLink } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';

export interface TabItem {
  name: string;
  to: string;
  icon?: LucideIcon;
  badge?: string | number;
}

interface TabsNavProps {
  tabs: TabItem[];
  className?: string;
}

export const TabsNav: React.FC<TabsNavProps> = ({ tabs, className = '' }) => {
  return (
    <div className={`border-b border-slate-200 ${className}`}>
      <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `group inline-flex items-center gap-2 py-3 px-1 border-b-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-teal text-teal'
                    : 'border-transparent text-textSecondary hover:text-textPrimary hover:border-slate-300'
                }`
              }
            >
              {Icon && (
                <Icon
                  className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors"
                  aria-hidden="true"
                />
              )}
              <span>{tab.name}</span>
              {tab.badge !== undefined && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600 border border-slate-200">
                  {tab.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
