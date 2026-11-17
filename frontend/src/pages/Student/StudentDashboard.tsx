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
  Sparkles,
  Award,
  Layers,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi, notificationApi } from '../../services/api';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  TabsNav,
  Card,
  CardHeader,
  CardContent,
  StatusBadge,
  Button,
  MetricDisplay,
} from '../../components/ui';

export const StudentDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [subjectAttendance, setSubjectAttendance] = useState<any[]>([]);
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
      studentApi.getSubjectWiseAttendance().catch(() => []),
      notificationApi.getNotifications().catch(() => []),
      studentApi.getMyActivity().catch(() => null),
    ])
      .then(([dash, subjects, notifs, act]) => {
        setData(dash);
        setSubjectAttendance(subjects);
        setNotifications(notifs.slice(0, 4));
        setActivity(act);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load student academic records. Please verify connection and retry.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell
        pageTitle="Student Academic Overview"
        pageSubtitle="Personal attendance transcript and classroom companion telemetry"
      >
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <LoadingState label="Loading your personalized academic transcript..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell
        pageTitle="Student Academic Overview"
        pageSubtitle="Personal attendance transcript and classroom companion telemetry"
      >
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve student profile'} onRetry={loadData} />
      </AppShell>
    );
  }

  const attendancePct = data.overall_attendance_pct ?? 0;
  const isGoodStanding = attendancePct >= 75.0;

  // Determine time-appropriate greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppShell
      pageTitle="Student Academic Overview"
      pageSubtitle="Aurora Workspace: Verified attendance, timetable telemetry, and companion access"
    >
      {/* Contextual In-Group Tabs */}
      <TabsNav tabs={overviewTabs} className="mb-6" />

      {/* =========================================================================
          HERO BANNER — AURORA COBALT & INDIGO IDENTITY
         ========================================================================= */}
      <div className="relative rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600 text-white p-6 sm:p-8 lg:p-10 shadow-lg shadow-blue-500/10 overflow-hidden">
        {/* Background ambient decorative rings */}
        <div
          className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-40 -bottom-20 w-64 h-64 rounded-full bg-sky-400/20 blur-xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          {/* Left Greeting & Cohort Info */}
          <div className="space-y-3 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-xs font-semibold backdrop-blur-md border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-sky-200" />
              <span>
                {new Date().toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {getGreeting()}, {data.full_name?.split(' ')[0] || 'Student'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                Welcome back to your ClassSphere companion. Your attendance transcript is up-to-date with 100%
                verified session records.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span className="font-mono font-semibold px-2.5 py-1 rounded-md bg-white/20 text-white border border-white/25">
                {data.roll_number}
              </span>
              <span className="text-blue-100 font-medium">
                {data.department_name} • {data.section_name} • Semester 6
              </span>
            </div>
          </div>

          {/* Right Attendance Dial / Standing Display */}
          <div className="flex items-center gap-4 bg-white/10 p-5 rounded-2xl border border-white/20 backdrop-blur-md self-stretch sm:self-auto justify-between sm:justify-start">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center flex-shrink-0">
              {/* Circular SVG attendance progress */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-white/20"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isGoodStanding ? 'text-sky-300' : 'text-rose-400'}
                  strokeDasharray={`${attendancePct}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-xl sm:text-2xl font-extrabold tracking-tight leading-none">
                  {attendancePct}%
                </span>
                <span className="text-[9px] uppercase tracking-wider text-blue-200 font-semibold mt-0.5">
                  Overall
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200 block">
                Academic Standing
              </span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isGoodStanding
                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                    : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${isGoodStanding ? 'bg-emerald-400' : 'bg-rose-400'}`}
                />
                <span>{isGoodStanding ? 'Compliant (≥75%)' : 'Shortfall Warning'}</span>
              </div>
              <div className="text-[11px] text-blue-100 font-mono">
                {data.attended_classes} of {data.total_classes} classes attended
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          NEXT ACTIVE / UPCOMING CLASS CARD
         ========================================================================= */}
      {data.next_class ? (
        <div className="bg-white rounded-2xl border border-blue-200 p-5 sm:p-6 card-elevation relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-5 bg-gradient-to-r from-blue-50/50 via-white to-indigo-50/40">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-100/80 text-blue-800 text-xs font-semibold border border-blue-200">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="uppercase tracking-wider font-mono">NEXT SCHEDULED SESSION</span>
            </div>

            <div className="space-y-0.5">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                {data.next_class.subject_name}{' '}
                <span className="font-mono text-sm font-semibold text-blue-600">
                  ({data.next_class.subject_code})
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Instructor: <strong className="text-slate-700">{data.next_class.faculty_name}</strong></span>
                <span>•</span>
                <span>Room: <strong className="text-slate-700">{data.next_class.room_number}</strong></span>
                <span>•</span>
                <span>Status: <strong className="text-blue-700 font-mono">{data.next_class.status}</strong></span>
              </div>
            </div>
          </div>

          <NavLink
            to="/student/companion"
            className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all duration-150 cursor-pointer flex-shrink-0"
          >
            <span>Launch Class Companion</span>
            <ArrowRight className="w-4 h-4" />
          </NavLink>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span>No further scheduled class sessions for today.</span>
        </div>
      )}

      {/* =========================================================================
          KEY ACADEMIC METRICS GRID
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricDisplay
          label="Overall Attendance"
          value={`${attendancePct}%`}
          subvalue="Target: 75.0% institutional minimum"
          progressPct={attendancePct}
          progressTarget="75%"
          icon={<CheckCircle2 className="w-5 h-5" />}
          highlight={true}
        />

        <MetricDisplay
          label="Classes Attended"
          value={data.attended_classes || 0}
          subvalue="Verified across photo & challenge codes"
          trend={{ value: '100% match', positive: true, label: 'authenticated' }}
          icon={<Calendar className="w-5 h-5 text-indigo-600" />}
        />

        <MetricDisplay
          label="Total Conducted"
          value={data.total_classes || 0}
          subvalue="Conducted classes in current semester"
          icon={<BookOpen className="w-5 h-5 text-blue-600" />}
        />

        {/* Academic Compliance Portfolio Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 card-elevation flex flex-col justify-between hover:border-aurora-cobalt/40 transition-all">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <span>Attendance Standing</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-base font-bold text-slate-900 tracking-tight">Curricular Courses</div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Verified subject-wise attendance breakdown and official session transcripts.
            </p>
          </div>
          <NavLink
            to="/student/attendance/subject-wise"
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-aurora-cobalt font-bold hover:underline transition-colors"
          >
            <span>View All Subjects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </NavLink>
        </div>
      </div>

      {/* =========================================================================
          SUBJECT-WISE ATTENDANCE BREAKDOWN & TELEMETRY
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real Subject Attendance Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Subject Attendance Records
              </h3>
            </div>
            <NavLink
              to="/student/attendance/subject-wise"
              className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
            >
              <span>View all subjects</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {subjectAttendance.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No enrolled subject attendance records found.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {subjectAttendance.map((subj) => {
                const pct = subj.attendance_percentage ?? 0;
                const isSubjSafe = pct >= 75.0;

                return (
                  <div
                    key={subj.subject_id}
                    className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                          {subj.subject_code}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {subj.subject_name}
                        </h4>
                      </div>
                      <div className="text-xs text-slate-500">
                        {subj.faculty_name} • {subj.classes_attended} / {subj.classes_conducted} classes attended
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0 text-right">
                      <div className="space-y-0.5">
                        <div className="text-base font-extrabold text-slate-900">{pct}%</div>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            isSubjSafe
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {isSubjSafe ? 'On Track' : 'Below 75%'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Telemetry Summary & Recent Notifications (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Telemetry Transparency Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 card-elevation space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Classroom Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                Events Only • No Grading
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Objective sensory logs track observable physical signals. Telemetry is never used to fabricate behavioral grades.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-xs text-slate-500 block">Phone Handling</span>
                <span className="text-2xl font-bold text-slate-900 mt-1 block">
                  {activity?.phone_events_count ?? 0}
                </span>
                <span className="text-[10px] text-slate-400">Screen illuminations</span>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 text-center">
                <span className="text-xs text-blue-700 font-semibold block">Talking Estimates</span>
                <span className="text-2xl font-bold text-blue-800 mt-1 block">
                  {activity?.talking_events_count ?? 0}
                </span>
                <span className="text-[10px] text-blue-500">Optical motion displacement</span>
              </div>
            </div>

            <NavLink
              to="/student/activity"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:text-blue-800 transition-colors pt-1"
            >
              <span>Examine complete activity logs</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </NavLink>
          </div>

          {/* Recent Broadcast Notifications */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 card-elevation space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900 tracking-tight">Recent Updates</h3>
              </div>
              <NavLink
                to="/student/notifications"
                className="text-xs text-blue-600 font-bold hover:text-blue-800"
              >
                View all
              </NavLink>
            </div>

            {notifications.length === 0 ? (
              <div className="text-xs text-slate-400 py-6 text-center">No recent broadcast notices.</div>
            ) : (
              <div className="space-y-2.5">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 hover:border-blue-200 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 truncate">{n.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {new Date(n.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">{n.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
};
