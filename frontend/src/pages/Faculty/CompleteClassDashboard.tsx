import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Video,
  FileText,
  UserCheck,
  ShieldAlert,
  ArrowRight,
  Activity,
  LayoutDashboard,
  Smartphone,
  MessageSquare,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { facultyApi } from '../../services/api';
import { LoadingState, ErrorState, TabsNav, StatusBadge, Card } from '../../components/ui';

export const CompleteClassDashboard: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const id = classId ? parseInt(classId, 10) : 1;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const classroomTabs = [
    { name: "Today's Classes", to: '/faculty/today-classes', icon: BookOpen },
    { name: 'Class Session Dashboard', to: `/faculty/class/${id}/dashboard`, icon: LayoutDashboard },
    { name: 'Session Log Timeline', to: `/faculty/class/${id}/logs`, icon: FileText },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    facultyApi
      .getClassDashboard(id)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load class session operational dashboard.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <AppShell pageTitle="Complete Class Dashboard" pageSubtitle="Real-time class operations">
        <TabsNav tabs={classroomTabs} className="mb-6" />
        <LoadingState label="Loading classroom operations and stream telemetry..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell pageTitle="Complete Class Dashboard" pageSubtitle="Real-time class operations">
        <TabsNav tabs={classroomTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve class session data'} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell
      pageTitle="Complete Class Dashboard"
      pageSubtitle="Single-pane overview answering: What is happening in this classroom, and what requires attention?"
    >
      {/* Contextual Tabs */}
      <TabsNav tabs={classroomTabs} className="mb-6" />

      {/* Top Session Banner (Emerald Studio theme) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold bg-emerald-900 text-white">
                {data.subject_code}
              </span>
              <span className="text-xs font-semibold text-slate-600">
                {data.section_name} • Room {data.room_number}
              </span>
              <StatusBadge status={data.session_status} />
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-800 border border-amber-200">
                MODE: {data.mode}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight">
              {data.subject_name}
            </h2>
            <p className="text-xs text-textSecondary mt-1 font-medium">Topic: {data.topic || 'Standard Curriculum'}</p>
          </div>

          <div className="flex items-center gap-2.5">
            <NavLink
              to="/faculty/attendance/session"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              <span>Manage Attendance</span>
            </NavLink>
            <NavLink
              to="/faculty/live-classroom"
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Video className="w-4 h-4 text-emerald-400" />
              <span>Live Camera</span>
            </NavLink>
          </div>
        </div>

        {/* Operational Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">
                Scheduled vs Actual
              </span>
              <div className="text-xs font-bold text-textPrimary mt-0.5 font-mono">{data.scheduled_timing}</div>
              <span className="text-[11px] text-textSecondary font-mono">Actual: {data.actual_timing}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-600">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">
                Attendance Rate
              </span>
              <div className="text-xs font-bold text-emerald-700 mt-0.5 font-mono">
                {data.attendance_summary?.attendance_rate}% Verified
              </div>
              <span className="text-[11px] text-textSecondary">
                {data.attendance_summary?.present_count} Present of {data.attendance_summary?.total_enrolled}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-emerald-700">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">
                Camera Stream
              </span>
              <div className="text-xs font-bold text-textPrimary mt-0.5 truncate max-w-[140px]">
                {data.camera_status?.camera_name}
              </div>
              <span className="text-[11px] text-emerald-700 font-mono font-medium">
                ● {data.camera_status?.status} ({data.camera_status?.health})
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white border border-slate-200 text-amber-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">
                Active Alerts
              </span>
              <div
                className={`text-xs font-bold mt-0.5 font-mono ${
                  data.active_alerts_count > 0 ? 'text-brandDanger' : 'text-textPrimary'
                }`}
              >
                {data.active_alerts_count} Unresolved
              </div>
              <span className="text-[11px] text-textSecondary">Safety & posture telemetry</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operational Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Attendance Breakdown (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Attendance Breakdown</h3>
              <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                PIN: {data.attendance_summary?.verification_challenge || 'CS8492'}
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <span className="text-emerald-900 font-medium">Present (Verified Photo)</span>
                <span className="font-bold text-brandSuccess font-mono">{data.attendance_summary?.present_count}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-textSecondary">Late Arrivals</span>
                <span className="font-bold text-amber-700 font-mono">{data.attendance_summary?.late_count}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-textSecondary">Pending Review Queue</span>
                <span className="font-bold text-slate-800 font-mono">{data.attendance_summary?.unverified_count}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-red-50/50 border border-red-100">
                <span className="text-red-900 font-medium">Absent</span>
                <span className="font-bold text-brandDanger font-mono">{data.attendance_summary?.absent_count}</span>
              </div>
            </div>
          </div>

          <NavLink
            to="/faculty/attendance/session"
            className="mt-6 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl text-center transition-colors block shadow-sm cursor-pointer"
          >
            Review Attendance Queue
          </NavLink>
        </div>

        {/* Observable Activity Summary (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Class Telemetry</h3>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded uppercase font-semibold">
                Events Only
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-[11px] text-textSecondary font-semibold">Total Observed Detections</div>
                <div className="text-2xl font-bold text-textPrimary mt-0.5 font-mono">
                  {data.activity_summary?.total_events}
                </div>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-3.5 h-3.5 text-slate-600" />
                  <span className="text-textSecondary">Phone Handling Detections</span>
                </div>
                <span className="font-bold text-textPrimary font-mono">{data.activity_summary?.phone_events}</span>
              </div>
              <div className="flex justify-between items-center text-xs p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-textSecondary">Talking Motion Displacements</span>
                </div>
                <span className="font-bold text-textPrimary font-mono">{data.activity_summary?.talking_events}</span>
              </div>
            </div>
          </div>

          <NavLink
            to="/faculty/activity/individual"
            className="mt-6 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors border border-slate-200 block cursor-pointer"
          >
            View Individual Table
          </NavLink>
        </div>

        {/* Class Log Timeline Preview (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">Session Log Timeline</h3>
              <FileText className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {!data.timeline_logs || data.timeline_logs.length === 0 ? (
                <div className="text-xs text-textSecondary py-6 text-center">No logs logged for this session.</div>
              ) : (
                data.timeline_logs.map((log: any) => (
                  <div key={log.id} className="text-xs border-l-2 border-emerald-500 pl-3 py-0.5 space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] text-textSecondary font-mono">
                      <span className="font-bold text-emerald-950">{log.event_type}</span>
                      <span>{log.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-textPrimary leading-snug">{log.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <NavLink
            to={`/faculty/class/${id}/logs`}
            className="mt-4 text-xs text-emerald-700 hover:underline font-semibold block text-center cursor-pointer"
          >
            Open Full Chronological Log
          </NavLink>
        </div>
      </div>
    </AppShell>
  );
};
