import React, { useState, useEffect } from 'react';
import { Bell, Sparkles, Video, CheckCircle2, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationApi } from '../../services/api';
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
    notificationApi.getNotifications().then((data) => setNotifications(data)).catch(() => {});
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  return (
    <header className="h-16 bg-white border-b border-mutedBlue px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Title & context */}
      <div>
        <h1 className="text-base sm:text-lg font-bold text-textPrimary tracking-tight">
          {pageTitle || 'ClassSphere Portal'}
        </h1>
        {pageSubtitle && (
          <p className="text-[11px] text-textSecondary hidden sm:block">{pageSubtitle}</p>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-4">
        {/* CRITICAL PRD REQUIREMENT: Clear Mode Indicator */}
        <div
          onClick={() => setIsSimulationMode(!isSimulationMode)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border cursor-pointer select-none transition-all ${
            isSimulationMode
              ? 'bg-amber-50 text-brandWarning border-amber-200 hover:bg-amber-100'
              : 'bg-emerald-50 text-brandSuccess border-emerald-200 hover:bg-emerald-100'
          }`}
          title="Click to toggle between SIMULATION and CONNECTED camera modes"
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isSimulationMode ? 'bg-brandWarning animate-pulse' : 'bg-brandSuccess'
            }`}
          />
          <span>{isSimulationMode ? 'MODE: SIMULATED (DEMO DATA)' : 'MODE: CONNECTED (AUTHORIZED CCTV)'}</span>
        </div>

        {/* Role Pill */}
        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold bg-surface border border-mutedBlue text-textPrimary">
          {role}
        </span>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg text-textSecondary hover:text-textPrimary hover:bg-surface transition-colors relative cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-brandDanger text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-mutedBlue p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-mutedBlue mb-3">
                <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                  Classroom Notifications ({unreadCount} new)
                </span>
                <span className="text-[10px] text-textSecondary">Real-time WebSocket alerts</span>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-xs text-textSecondary py-4 text-center">No notifications yet.</div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-lg border text-xs transition-colors ${
                        item.is_read
                          ? 'bg-surface/50 border-mutedBlue/50 text-textSecondary'
                          : 'bg-teal-light/40 border-teal/20 text-textPrimary font-medium'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-semibold text-textPrimary">{item.title}</div>
                        {!item.is_read && (
                          <button
                            onClick={() => handleMarkRead(item.id)}
                            className="text-[10px] text-teal hover:underline font-normal cursor-pointer"
                          >
                            Mark read
                          </button>
                        )}
                      </div>
                      <p className="mt-1 text-[11px] text-textSecondary leading-snug">{item.message}</p>
                      <div className="mt-1.5 flex items-center justify-between text-[10px] text-textSecondary/80">
                        <span className="font-mono">{new Date(item.created_at).toLocaleTimeString()}</span>
                        <span className="uppercase text-[9px] px-1.5 py-0.5 rounded bg-white border border-mutedBlue">
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
