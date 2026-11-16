import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldAlert,
  Video,
  Activity,
  UserCheck,
  ChevronRight,
  LayoutDashboard,
  Radio,
  FileText,
  AlertTriangle,
  Users,
  Camera,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { facultyApi } from '../../services/api';
import {
  LoadingState,
  ErrorState,
  EmptyState,
  TabsNav,
  StatusBadge,
  Card,
  Button,
  MetricDisplay,
} from '../../components/ui';

export const FacultyDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const facultyOverviewTabs = [
    { name: 'Faculty Operational Overview', to: '/faculty/dashboard', icon: LayoutDashboard },
    { name: 'Daily Schedule Timeline', to: '/faculty/daily-overview', icon: Calendar },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    facultyApi
      .getDashboard()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load faculty operational dashboard.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell
        pageTitle="Faculty Operations Dashboard"
        pageSubtitle="Emerald Studio: Assigned classes, camera feeds, and attendance verification"
      >
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <LoadingState label="Loading classroom operations and schedule telemetry..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell
        pageTitle="Faculty Operations Dashboard"
        pageSubtitle="Emerald Studio: Assigned classes, camera feeds, and attendance verification"
      >
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve faculty dashboard data'} onRetry={loadData} />
      </AppShell>
    );
  }

  const activeClass = data.today_classes?.find((c: any) => c.status === 'ACTIVE');

  return (
    <AppShell
      pageTitle="Faculty Operations Dashboard"
      pageSubtitle="Emerald Studio: Assigned teaching schedule, classroom camera streams, and verification queues"
    >
      {/* Contextual Tabs */}
      <TabsNav tabs={facultyOverviewTabs} className="mb-6" />

      {/* =========================================================================
          TOP OPERATIONAL STATUS STRIP
         ========================================================================= */}
      <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 sm:p-6 card-elevation flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-base shadow-md shadow-emerald-600/20 flex-shrink-0">
            {data.faculty_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2) || 'FA'}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {data.faculty_name}
              </h2>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                {data.designation}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Department of {data.department} •{' '}
              {new Date().toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {data.active_safety_alerts > 0 && (
            <NavLink
              to="/faculty/safety"
              className="px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-100 transition-colors cursor-pointer animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>{data.active_safety_alerts} Safety Alerts Requiring Review</span>
            </NavLink>
          )}

          <NavLink
            to="/faculty/live-classroom"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Open Camera Monitor</span>
          </NavLink>
        </div>
      </div>

      {/* =========================================================================
          ACTIVE CLASS SPOTLIGHT (EMERALD STUDIO HERO)
         ========================================================================= */}
      {activeClass ? (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-800 text-white p-6 sm:p-8 shadow-lg shadow-emerald-900/10 border border-emerald-700 relative overflow-hidden mb-6">
          <div
            className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE CLASS SESSION IN PROGRESS</span>
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-emerald-200 border border-white/15">
                  Room {activeClass.room_number}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  MODE: {activeClass.mode}
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
                {activeClass.subject_name}{' '}
                <span className="text-emerald-300 font-mono text-base font-semibold">
                  ({activeClass.subject_code})
                </span>
              </h3>

              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
                Section {activeClass.section_name} • Scheduled: {activeClass.scheduled_start} - {activeClass.scheduled_end} •{' '}
                {activeClass.enrolled_count} Students enrolled
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <NavLink
                to="/faculty/attendance/session"
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <UserCheck className="w-4 h-4" />
                <span>Verify Attendance</span>
              </NavLink>
              <NavLink
                to="/faculty/live-classroom"
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all"
              >
                <Video className="w-4 h-4" />
                <span>Classroom Stream</span>
              </NavLink>
              <NavLink
                to={`/faculty/class/${activeClass.id}/dashboard`}
                className="px-4 py-2.5 rounded-xl bg-transparent hover:bg-white/10 text-emerald-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-all"
              >
                <span>Full Telemetry</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>
          </div>
        </div>
      ) : null}

      {/* =========================================================================
          MAIN OPERATIONAL LAYOUT (2-COLUMN GRID)
         ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Today's Schedule & Class Execution (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Today's Full Schedule Directory */}
          <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base tracking-tight">Today's Class Schedule</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological teaching timetable and session verification actions
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
                {data.today_classes_count || 0} Sessions Today
              </span>
            </div>

            {!data.today_classes || data.today_classes.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No Classes Scheduled Today"
                description="You have no assigned teaching sessions scheduled on the department timetable for today."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.today_classes.map((c: any) => (
                  <div
                    key={c.id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-700 text-white">
                          {c.subject_code}
                        </span>
                        <span className="text-xs text-slate-600 font-semibold">
                          {c.section_name} • Room {c.room_number}
                        </span>
                        <StatusBadge status={c.status} />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-300">
                          MODE: {c.mode}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900 tracking-tight">{c.subject_name}</h4>
                      <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {c.scheduled_start} - {c.scheduled_end}
                          </span>
                        </span>
                        <span>•</span>
                        <span>Enrolled: <strong className="text-slate-700">{c.enrolled_count} Students</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                      <NavLink
                        to={`/faculty/class/${c.id}/dashboard`}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Telemetry</span>
                      </NavLink>
                      <NavLink
                        to="/faculty/attendance/session"
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Attendance</span>
                      </NavLink>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Operational Mission Control Status Hub (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workload Status KPI Box */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 card-elevation space-y-4">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Teaching Workload Status</span>
              <span className="text-[10px] text-emerald-600 font-mono font-bold">TODAY</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                <span className="text-[11px] text-slate-500 block">Conducted</span>
                <span className="text-2xl font-bold font-mono text-slate-900 mt-0.5 block">
                  {data.completed_classes_count || 0}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Finalized in DB</span>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
                <span className="text-[11px] text-emerald-700 font-semibold block">In-Progress</span>
                <span className="text-2xl font-bold font-mono text-emerald-800 mt-0.5 block">
                  {data.active_classes_count || 0}
                </span>
                <span className="text-[10px] text-emerald-600 block mt-0.5">Telemetry Streaming</span>
              </div>
            </div>
          </div>

          {/* Attendance Review Hub Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600" />
                <span>Attendance Verification</span>
              </h4>
              <StatusBadge status={data.active_classes_count > 0 ? 'ACTIVE' : 'COMPLETED'} />
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify biometric matching results, review candidate discrepancies, and record formal audit overrides.
            </p>
            <NavLink
              to="/faculty/attendance/session"
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer block text-center"
            >
              <span>Open Attendance Session</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          {/* Classroom Camera System Status Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-teal-600" />
                <span>Classroom Cameras</span>
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-300 font-semibold">
                <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                <span>ONLINE</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Multi-task computer vision monitoring: Person presences, phone usage, and optical mouth flow.
            </p>
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
              <span>Dual Ingestion Mode</span>
              <span className="font-mono text-[11px] text-emerald-700 font-bold">SIMULATION / RTSP</span>
            </div>
            <NavLink
              to="/faculty/live-classroom"
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 cursor-pointer block text-center"
            >
              <span>Monitor Live Feeds</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>
          </div>

          {/* Safety Review Alerts Widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Safety Review Alerts</span>
              </h4>
              <span
                className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                  data.active_safety_alerts > 0
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {data.active_safety_alerts || 0} Alerts
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {data.active_safety_alerts > 0
                ? 'Computer vision anomaly models have flagged events requiring physical inspection and acknowledgment.'
                : 'All assigned classrooms report normal status with no active emergency flags.'}
            </p>
            <NavLink
              to="/faculty/safety"
              className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 cursor-pointer block text-center"
            >
              <span>Open Safety Centre</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
