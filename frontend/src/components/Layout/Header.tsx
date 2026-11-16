import React, { useState, useEffect } from 'react';
import { Bell, ShieldCheck, Video, CheckCircle2, Radio, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi, cameraApi } from '../../services/api';
import { NotificationItem } from '../../types';

interface HeaderProps {
  pageTitle?: string;
  pageSubtitle?: string;
}

export const Header: React.FC<HeaderProps> = ({ pageTitle, pageSubtitle }) => {
  const { user, role } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSimulationMode, setIsSimulationMode] = useState(true);

  useEffect(() => {
    notificationApi
      .getNotifications()
      .then((data) => setNotifications(data))
      .catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleToggleMode = async () => {
    try {
      // Toggle backend camera mode if faculty or hod
      if (role === 'FACULTY' || role === 'HOD') {
        const res = await cameraApi.toggleMode(1);
        setIsSimulationMode(res.new_mode === 'SIMULATION');
      } else {
        setIsSimulationMode(!isSimulationMode);
      }
    } catch {
      setIsSimulationMode(!isSimulationMode);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[var(--role-border)] px-6 flex items-center justify-between sticky top-0 z-30 transition-colors duration-200">
      {/* Title & Context */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-[var(--role-text)] tracking-tight">
          {pageTitle || 'ClassSphere Portal'}
        </h1>
        {pageSubtitle && (
          <p className="text-[11px] text-[var(--role-text-muted)] hidden sm:block leading-snug">
            {pageSubtitle}
          </p>
        )}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Real-time Ingestion Mode Pill */}
        <button
          type="button"
          onClick={handleToggleMode}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer select-none transition-all ${
            isSimulationMode
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
          }`}
          title="Click to toggle between SIMULATION and CONNECTED camera modes"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulationMode ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'
            }`}
          />
          <span className="font-mono text-[10px] tracking-wide">
            {isSimulationMode ? 'SIMULATION (DEMO)' : 'CONNECTED (CCTV)'}
          </span>
        </button>

        {/* Role Pill */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--role-soft)] text-[var(--role-primary)] border border-[var(--role-soft-border)]">
          {role}
        </span>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-[var(--role-text-muted)] hover:text-[var(--role-text)] hover:bg-[var(--role-soft)] transition-colors relative cursor-pointer focus-ring"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-slate-200 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <span className="text-xs font-bold text-[var(--role-text)] uppercase tracking-wider">
                  Notifications ({unreadCount} new)
                </span>
                <span className="text-[10px] text-[var(--role-text-muted)]">Live WebSocket events</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {notifications.length === 0 ? (
                  <div className="text-xs text-[var(--role-text-muted)] py-6 text-center">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border text-xs transition-colors ${
                        item.is_read
                          ? 'bg-slate-50/70 border-slate-100 text-[var(--role-text-muted)]'
                          : 'bg-[var(--role-soft)]/70 border-[var(--role-soft-border)] text-[var(--role-text)] font-medium'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-[var(--role-text)] tracking-tight">
                          {item.title}
                        </div>
                        {!item.is_read && (
                          <button
                            type="button"
                            onClick={() => handleMarkRead(item.id)}
                            className="text-[10px] text-[var(--role-primary)] hover:underline font-semibold cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--role-text-muted)] leading-relaxed">
                        {item.message}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                        <span className="font-mono">
                          {new Date(item.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        <span className="uppercase text-[9px] px-1.5 py-0.2 rounded bg-white border border-slate-200 font-mono">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
