import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  CheckCircle,
  Activity,
  Bell,
  User,
  BookOpen,
  UserCheck,
  Video,
  ShieldAlert,
  Users,
  FileText,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface CompactNavItem {
  name: string;
  to: string;
  matchPrefix: string;
  icon: React.ElementType;
  badge?: number | string;
}

export const Sidebar: React.FC = () => {
  const { role, logout, user } = useAuth();
  const location = useLocation();

  const getNavItems = (currentRole: Role | null): CompactNavItem[] => {
    if (currentRole === 'STUDENT') {
      return [
        {
          name: 'Overview',
          to: '/student/dashboard',
          matchPrefix: '/student/overview',
          icon: LayoutDashboard,
        },
        {
          name: 'Attendance',
          to: '/student/attendance/subject-wise',
          matchPrefix: '/student/attendance',
          icon: CheckCircle,
        },
        {
          name: 'Class Insights',
          to: '/student/activity',
          matchPrefix: '/student/activity',
          icon: Activity,
        },
        {
          name: 'Notifications',
          to: '/student/notifications',
          matchPrefix: '/student/notifications',
          icon: Bell,
        },
        {
          name: 'Account',
          to: '/student/account',
          matchPrefix: '/student/account',
          icon: User,
        },
      ];
    } else if (currentRole === 'FACULTY') {
      return [
        {
          name: 'Overview',
          to: '/faculty/dashboard',
          matchPrefix: '/faculty/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Classroom',
          to: '/faculty/today-classes',
          matchPrefix: '/faculty/class',
          icon: BookOpen,
        },
        {
          name: 'Attendance',
          to: '/faculty/attendance/session',
          matchPrefix: '/faculty/attendance',
          icon: UserCheck,
        },
        {
          name: 'Class Intelligence',
          to: '/faculty/live-classroom',
          matchPrefix: '/faculty/live-classroom',
          icon: Video,
        },
        {
          name: 'Safety Centre',
          to: '/faculty/safety',
          matchPrefix: '/faculty/safety',
          icon: ShieldAlert,
        },
        {
          name: 'Account',
          to: '/faculty/account',
          matchPrefix: '/faculty/account',
          icon: User,
        },
      ];
    } else if (currentRole === 'HOD') {
      return [
        {
          name: 'Overview',
          to: '/hod/dashboard',
          matchPrefix: '/hod/dashboard',
          icon: LayoutDashboard,
        },
        {
          name: 'Academic Oversight',
          to: '/hod/faculty-overview',
          matchPrefix: '/hod/faculty-overview',
          icon: Users,
        },
        {
          name: 'Class Intelligence',
          to: '/hod/camera-overview',
          matchPrefix: '/hod/camera-overview',
          icon: Video,
        },
        {
          name: 'Safety Centre',
          to: '/hod/safety',
          matchPrefix: '/hod/safety',
          icon: ShieldAlert,
        },
        {
          name: 'Administration',
          to: '/hod/audit-logs',
          matchPrefix: '/hod/audit-logs',
          icon: FileText,
        },
        {
          name: 'Account',
          to: '/hod/account',
          matchPrefix: '/hod/account',
          icon: User,
        },
      ];
    }
    return [];
  };

  const navItems = getNavItems(role);

  return (
    <aside className="w-64 bg-[#10233F] text-white flex flex-col h-screen border-r border-[#1A3358] select-none flex-shrink-0">
      {/* Brand header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-white/10">
        <div className="w-9 h-9 rounded-xl bg-[#159A91] flex items-center justify-center text-white shadow-sm shadow-[#159A91]/20">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight text-white block leading-tight">ClassSphere</span>
          <span className="text-[10px] text-[#E6F6F5]/80 font-mono tracking-wide uppercase">
            {role || 'Academic Portal'}
          </span>
        </div>
      </div>

      {/* Compact Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1" aria-label="Sidebar Navigation">
        <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 px-3 mb-2.5">
          Portal Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.to ||
            location.pathname.startsWith(item.matchPrefix) ||
            (item.name === 'Classroom' && (location.pathname.includes('/faculty/class') || location.pathname.includes('/faculty/today-classes'))) ||
            (item.name === 'Class Intelligence' && (location.pathname.includes('/faculty/activity') || location.pathname.includes('/faculty/live-classroom') || location.pathname.includes('/hod/activity-overview') || location.pathname.includes('/hod/camera-overview'))) ||
            (item.name === 'Academic Oversight' && (location.pathname.includes('/hod/faculty-overview') || location.pathname.includes('/hod/class-overview'))) ||
            (item.name === 'Administration' && (location.pathname.includes('/hod/audit-logs') || location.pathname.includes('/hod/students') || location.pathname.includes('/hod/import')));

          return (
            <NavLink
              key={item.name}
              to={item.to}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#159A91] text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-white/6'
              }`}
            >
              <div className="flex items-center gap-3 truncate">
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-white/20 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User profile & logout footer */}
      <div className="p-4 border-t border-white/10 bg-[#0B182B]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-full object-cover border border-white/20 flex-shrink-0"
            />
            <div className="overflow-hidden">
              <div className="text-xs font-medium text-white truncate">{user?.full_name}</div>
              <div className="text-[10px] text-slate-400 truncate font-mono">{user?.institutional_id}</div>
            </div>
          </div>
          <button
            onClick={() => logout()}
            title="Sign out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors cursor-pointer focus-ring"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
