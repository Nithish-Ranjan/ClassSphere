import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  BookOpen,
  LayoutDashboard,
  Smartphone,
  MessageSquare,
  Bell,
  Radio,
  MapPin,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi, notificationApi } from '../../services/api';
import { LoadingState, ErrorState, TabsNav, Card, CardHeader, CardContent, StatusBadge } from '../../components/ui';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const overviewTabs = [
    { name: 'Student Overview', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Class Companion', to: '/student/companion', icon: Clock },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);

    Promise.all([
      studentApi.getDashboard(),
      notificationApi.getNotifications().catch(() => []),
      studentApi.getMyActivity().catch(() => null),
    ])
      .then(([dash, notifs, act]) => {
        setData(dash);
        setNotifications(notifs.slice(0, 3));
        setActivity(act);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load academic dashboard data. Please check connection and retry.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Student Overview" pageSubtitle="Academic attendance and verified session telemetry">
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <LoadingState label="Loading academic transcript and telemetry records..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell pageTitle="Student Overview" pageSubtitle="Academic attendance and verified session telemetry">
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve student profile'} onRetry={loadData} />
      </AppShell>
    );
  }

  const attendancePct = data.overall_attendance_pct ?? 0;
  const isGoodStanding = attendancePct >= 75.0;

  return (
    <AppShell pageTitle="Student Overview" pageSubtitle="Academic attendance and verified session telemetry">
      {/* In-Group Contextual Tabs */}
      <TabsNav tabs={overviewTabs} className="mb-6" />

      {/* Top Identity & Standing Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 card-elevation flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6F6F5] text-teal flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-textPrimary tracking-tight">
                {data.full_name}
              </h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {data.roll_number}
              </span>
            </div>
            <div className="text-xs text-textSecondary mt-0.5">
              {data.department_name} • {data.section_name} • Semester 6 (2026-2027)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
              isGoodStanding
                ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                : 'bg-red-50 text-brandDanger border border-red-200'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isGoodStanding ? 'bg-brandSuccess' : 'bg-brandDanger'}`} />
            <span>{data.status_summary || 'Enrolled in Good Standing'}</span>
          </span>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Overall Attendance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Overall Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-teal" />
          </div>
          <div className="text-3xl font-bold text-textPrimary tracking-tight">{attendancePct}%</div>
          <div className="mt-3 w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isGoodStanding ? 'bg-teal' : 'bg-brandDanger'
              }`}
              style={{ width: `${Math.min(attendancePct, 100)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-textSecondary flex justify-between font-mono">
            <span>Target: 75.0% min</span>
            <span className={isGoodStanding ? 'text-brandSuccess font-semibold' : 'text-brandDanger font-semibold'}>
              {isGoodStanding ? 'Compliant' : 'Shortfall Warning'}
            </span>
          </div>
        </div>

        {/* Classes Attended */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Attended Classes</span>
            <Calendar className="w-4 h-4 text-[#183B5B]" />
          </div>
          <div className="text-3xl font-bold text-textPrimary tracking-tight">{data.attended_classes || 0}</div>
          <p className="mt-2 text-[11px] text-textSecondary">
            Verified across multi-modal photo & challenge check-ins
          </p>
        </div>

        {/* Total Conducted */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Total Conducted</span>
            <BookOpen className="w-4 h-4 text-[#10233F]" />
          </div>
          <div className="text-3xl font-bold text-textPrimary tracking-tight">{data.total_classes || 0}</div>
          <p className="mt-2 text-[11px] text-textSecondary">
            Offered this term in CSE Section A
          </p>
        </div>

        {/* What If Quick Nav */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
              <span>What If Simulator</span>
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-sm font-semibold text-textPrimary">Project Attendance</div>
            <p className="mt-1 text-[11px] text-textSecondary">
              Model safe attendance margins before class sessions without altering records.
            </p>
          </div>
          <NavLink
            to="/student/what-if"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-teal font-semibold hover:text-teal-hover transition-colors"
          >
            <span>Launch Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* Next Upcoming Class Spotlight */}
      {data.next_class && (
        <div className="bg-[#10233F] text-white p-6 rounded-xl border border-[#1A3358] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[#E6F6F5] text-xs font-mono">
              <Clock className="w-3.5 h-3.5 text-teal" />
              <span>UPCOMING CLASS SESSION</span>
            </div>
            <h3 className="text-xl font-bold tracking-tight">
              {data.next_class.subject_name} ({data.next_class.subject_code})
            </h3>
            <p className="text-xs text-slate-300">
              Instructor: {data.next_class.faculty_name} • Room: {data.next_class.room_number} • Status:{' '}
              <span className="font-mono text-teal-light font-semibold">{data.next_class.status}</span>
            </p>
          </div>

          <NavLink
            to="/student/companion"
            className="px-4 py-2.5 rounded-lg bg-teal text-white hover:bg-teal-hover font-semibold text-xs flex items-center gap-2 shadow-sm transition-all whitespace-nowrap cursor-pointer"
          >
            <span>Open Class Companion</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      )}

      {/* Two-Column Lower Section: Activity Guarantee + Recent Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Objective Telemetry Records (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-slate-200 card-elevation space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-teal" />
              <h3 className="font-bold text-sm text-textPrimary tracking-tight">Classroom Telemetry Summary</h3>
            </div>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
              Events Only. No Scores.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <span className="text-xs text-textSecondary block">Phone Handling Events</span>
              <span className="text-2xl font-bold text-textPrimary mt-1 block">
                {activity?.phone_events_count ?? 0}
              </span>
              <span className="text-[10px] text-textSecondary">Active screen / handling detections</span>
            </div>
            <div className="p-3.5 rounded-xl bg-[#E6F6F5]/50 border border-teal/20 text-center">
              <span className="text-xs text-teal font-semibold block">Talking Estimates</span>
              <span className="text-2xl font-bold text-teal mt-1 block">
                {activity?.talking_events_count ?? 0}
              </span>
              <span className="text-[10px] text-teal">Optical mouth motion displacement</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-textSecondary flex items-center justify-between">
            <span>Objective telemetry tracks observable events without behavioral grading.</span>
            <NavLink
              to="/student/activity"
              className="text-xs text-teal font-semibold hover:text-teal-hover flex items-center gap-1"
            >
              <span>View details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>
        </div>

        {/* Right Column: Important Notifications (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200 card-elevation space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-teal" />
              <h3 className="font-bold text-sm text-textPrimary tracking-tight">Recent Notifications</h3>
            </div>
            <NavLink to="/student/notifications" className="text-xs text-teal font-semibold hover:text-teal-hover">
              View all
            </NavLink>
          </div>

          {notifications.length === 0 ? (
            <div className="text-xs text-textSecondary py-6 text-center">No recent broadcast notifications.</div>
          ) : (
            <div className="space-y-2.5">
              {notifications.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-textPrimary truncate">{n.title}</span>
                    <span className="text-[10px] font-mono text-textSecondary">
                      {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-textSecondary leading-snug line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};
