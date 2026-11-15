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
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { facultyApi } from '../../services/api';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge, Card } from '../../components/ui';

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
      .catch((err) => {
        setError('Failed to load faculty operational dashboard.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Faculty Dashboard" pageSubtitle="Operational overview of assigned classes, cameras, and attendance reviews">
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <LoadingState label="Loading faculty schedules and session telemetry..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell pageTitle="Faculty Dashboard" pageSubtitle="Operational overview of assigned classes, cameras, and attendance reviews">
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve faculty dashboard data'} onRetry={loadData} />
      </AppShell>
    );
  }

  const activeClass = data.today_classes?.find((c: any) => c.status === 'ACTIVE');

  return (
    <AppShell pageTitle="Faculty Operational Dashboard" pageSubtitle="Unified operational command: today's timetable, camera telemetry, and attendance reviews">
      {/* Contextual Tabs */}
      <TabsNav tabs={facultyOverviewTabs} className="mb-6" />

      {/* Top Operational Status Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 card-elevation flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#10233F] text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
            {data.faculty_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('')
              .slice(0, 2) || 'FA'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-textPrimary tracking-tight">
                {data.faculty_name}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {data.designation}
              </span>
            </div>
            <p className="text-xs text-textSecondary mt-0.5">
              Department of {data.department} • Today: {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {data.active_safety_alerts > 0 && (
            <NavLink
              to="/faculty/safety"
              className="px-3.5 py-2 rounded-lg bg-red-50 border border-red-200 text-brandDanger text-xs font-bold flex items-center gap-1.5 hover:bg-red-100 transition-colors cursor-pointer animate-pulse"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{data.active_safety_alerts} Incident Requiring Review</span>
            </NavLink>
          )}

          <NavLink
            to="/faculty/live-classroom"
            className="px-4 py-2 rounded-lg bg-teal text-white hover:bg-teal-hover text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Open Camera Monitor</span>
          </NavLink>
        </div>
      </div>

      {/* Main Operational Command Center (2-Column Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT COLUMN: Today's Schedule & Class Execution (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Class Live Spotlight (if a class is currently active) */}
          {activeClass && (
            <div className="bg-gradient-to-r from-[#10233F] to-[#183B5B] text-white p-6 rounded-xl border border-navy-light shadow-md">
              <div className="flex items-center justify-between gap-3 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ACTIVE CLASS IN PROGRESS</span>
                </span>
                <span className="text-xs font-mono text-teal-light">Room {activeClass.room_number}</span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-white mb-1">
                {activeClass.subject_name} ({activeClass.subject_code})
              </h3>
              <p className="text-xs text-slate-300 mb-4">
                Section {activeClass.section_name} • Scheduled: {activeClass.scheduled_start} - {activeClass.scheduled_end} • {activeClass.enrolled_count} Students
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-white/10">
                <NavLink
                  to="/faculty/attendance/session"
                  className="px-4 py-2 bg-teal hover:bg-teal-hover text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Live Attendance Session</span>
                </NavLink>
                <NavLink
                  to="/faculty/live-classroom"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 border border-white/15"
                >
                  <Video className="w-4 h-4" />
                  <span>View Room Camera</span>
                </NavLink>
                <NavLink
                  to={`/faculty/class/${activeClass.id}/dashboard`}
                  className="px-3 py-2 text-xs font-medium text-slate-300 hover:text-white transition-colors"
                >
                  Class Telemetry →
                </NavLink>
              </div>
            </div>
          )}

          {/* Today's Full Schedule Directory */}
          <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-textPrimary text-base">Today's Class Schedule</h3>
                <p className="text-xs text-textSecondary mt-0.5">Chronological teaching timetable and session controls</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
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
                    className="p-5 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#10233F] text-white">
                          {c.subject_code}
                        </span>
                        <span className="text-xs text-textSecondary font-semibold">
                          {c.section_name} • Room {c.room_number}
                        </span>
                        <StatusBadge status={c.status} />
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                          MODE: {c.mode}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-textPrimary">{c.subject_name}</h4>
                      <div className="text-xs text-textSecondary flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Scheduled: {c.scheduled_start} - {c.scheduled_end}</span>
                        <span>•</span>
                        <span>Enrolled: {c.enrolled_count} Students</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <NavLink
                        to={`/faculty/class/${c.id}/dashboard`}
                        className="px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-textPrimary text-xs font-semibold flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                        <span>Overview</span>
                      </NavLink>
                      <NavLink
                        to="/faculty/attendance/session"
                        className="px-3.5 py-1.5 rounded-lg bg-teal hover:bg-teal-hover text-white text-xs font-semibold flex items-center gap-1 transition-colors shadow-subtle cursor-pointer"
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
          {/* Operational Metrics Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-4">
            <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center justify-between">
              <span>Teaching Workload Status</span>
              <span className="text-[10px] text-teal font-mono">Today</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#F7F9FC] border border-slate-200">
                <span className="text-[11px] text-textSecondary block">Conducted</span>
                <span className="text-xl font-bold font-mono text-textPrimary">{data.completed_classes_count || 0}</span>
                <span className="text-[10px] text-textSecondary block mt-0.5">Locked to DB</span>
              </div>
              <div className="p-3 rounded-lg bg-[#F7F9FC] border border-slate-200">
                <span className="text-[11px] text-textSecondary block">In-Progress</span>
                <span className="text-xl font-bold font-mono text-teal">{data.active_classes_count || 0}</span>
                <span className="text-[10px] text-teal block mt-0.5">Streaming</span>
              </div>
            </div>
          </div>

          {/* Attendance Review Hub Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-teal" />
                <span>Attendance Verification</span>
              </h4>
              <StatusBadge status={data.active_classes_count > 0 ? 'ACTIVE' : 'COMPLETED'} />
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              Verify biometric matching results, review candidate discrepancies, and record formal audit overrides.
            </p>
            <NavLink
              to="/faculty/attendance/session"
              className="w-full py-2.5 px-3 rounded-lg bg-[#10233F] hover:bg-[#183B5B] text-white text-xs font-semibold flex items-center justify-between transition-colors shadow-subtle cursor-pointer block text-center"
            >
              <span>Open Attendance Session</span>
              <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          {/* Classroom Camera System Status Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#183B5B]" />
                <span>Classroom Cameras</span>
              </h4>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>ONLINE</span>
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              Real-time multi-task video analytics: Person detection, phone usage, and optical talking motion.
            </p>
            <div className="pt-1 flex items-center justify-between text-xs text-textSecondary border-t border-slate-100">
              <span>Dual Ingestion Mode</span>
              <span className="font-mono text-[11px] text-teal font-semibold">SIMULATION / RTSP</span>
            </div>
            <NavLink
              to="/faculty/live-classroom"
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-textPrimary text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 cursor-pointer block text-center"
            >
              <span>Monitor Live Feeds</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </NavLink>
          </div>

          {/* Important Safety & Incident Alerts Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-brandDanger" />
                <span>Safety Review Alerts</span>
              </h4>
              <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                data.active_safety_alerts > 0 ? 'bg-red-50 text-brandDanger border border-red-200' : 'bg-emerald-50 text-brandSuccess border border-emerald-200'
              }`}>
                {data.active_safety_alerts || 0} Alerts
              </span>
            </div>
            <p className="text-xs text-textSecondary leading-relaxed">
              {data.active_safety_alerts > 0
                ? 'Computer vision anomaly models have flagged events requiring physical inspection and acknowledgment.'
                : 'All assigned classrooms report normal status with no active emergency flags.'}
            </p>
            <NavLink
              to="/faculty/safety"
              className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-textPrimary text-xs font-semibold flex items-center justify-between transition-colors border border-slate-200 cursor-pointer block text-center"
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
