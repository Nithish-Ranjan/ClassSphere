import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, pageTitle, pageSubtitle }) => {
  return (
    <div className="flex h-screen w-full bg-surface overflow-hidden">
      {/* Grouped Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header pageTitle={pageTitle} pageSubtitle={pageSubtitle} />
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
