import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  pageSubtitle?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, pageTitle, pageSubtitle }) => {
  const { user } = useAuth();
  const theme = user?.role || 'STUDENT';

  return (
    <div
      data-theme={theme}
      className="flex h-screen w-full bg-[var(--role-background)] text-[var(--role-text)] overflow-hidden transition-colors duration-300"
    >
      {/* Role-Themed Sidebar */}
      <Sidebar />

      {/* Main App Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header pageTitle={pageTitle} pageSubtitle={pageSubtitle} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
};
