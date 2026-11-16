import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, Filter, AlertTriangle, ShieldCheck, CheckCheck } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { notificationApi } from '../../services/api';
import { NotificationItem } from '../../types';
import { LoadingState, EmptyState, Card } from '../../components/ui';

export const NotificationsView: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const loadNotifications = () => {
    notificationApi.getNotifications().then((data) => {
      setNotifications(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await notificationApi.markAsRead(n.id);
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <AppShell
      pageTitle="Notifications Centre"
      pageSubtitle="Chronological broadcast alerts, attendance verifications, and safety advisories"
    >
      <div className="space-y-5">
        {/* Top Control Bar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-role-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-role-primary text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-role-soft text-role-primary hover:opacity-90 transition-all border border-role-primary/20 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <LoadingState label="Loading classroom notifications..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            description="You are fully up to date. New class sessions, attendance verification calls, and safety alerts will appear here in real time."
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.is_read
                    ? 'bg-white border-slate-200 text-slate-600 opacity-85 shadow-xs'
                    : 'bg-white border-role-primary/40 shadow-sm ring-1 ring-role-primary/10'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl mt-0.5 flex-shrink-0 ${
                        item.category === 'INCIDENT'
                          ? 'bg-red-50 text-brandDanger border border-red-200'
                          : item.category === 'ATTENDANCE'
                          ? 'bg-role-soft text-role-primary border border-role-primary/20'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.category === 'INCIDENT' ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : item.category === 'ATTENDANCE' ? (
                        <ShieldCheck className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-slate-900 tracking-tight">{item.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 uppercase font-semibold">
                          {item.category}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{item.message}</p>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {!item.is_read && (
                    <button
                      onClick={() => handleMarkRead(item.id)}
                      className="text-xs text-role-primary hover:underline font-semibold px-3 py-1.5 rounded-lg hover:bg-role-soft transition-colors cursor-pointer whitespace-nowrap"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
