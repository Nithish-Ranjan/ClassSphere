import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Video,
  FileText,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Building,
  Upload,
  Calendar,
  Layers,
  ChevronRight,
  ShieldAlert,
  Radio,
  FileSpreadsheet,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { LoadingState, ErrorState, TabsNav, StatusBadge, MetricDisplay, Card } from '../../components/ui';
import { hodApi } from '../../services/api';

export const HODDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hodOverviewTabs = [
    { name: 'Executive Overview', to: '/hod/dashboard', icon: Building },
    { name: 'Faculty Workload', to: '/hod/faculty-overview', icon: Users },
    { name: 'Camera Infrastructure', to: '/hod/camera-overview', icon: Video },
    { name: 'Safety Review', to: '/hod/safety', icon: ShieldAlert },
    { name: 'Audit & Records', to: '/hod/audit-logs', icon: FileText },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([
      hodApi.getDashboard(),
      hodApi.getAuditLogs(5).catch(() => []),
    ])
      .then(([dash, logs]) => {
        setData(dash);
        setAuditLogs(logs);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to retrieve departmental executive metrics.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell
        pageTitle="HOD Executive Command Center"
        pageSubtitle="Executive Plum: Departmental governance, faculty oversight, and safety review"
      >
        <TabsNav tabs={hodOverviewTabs} className="mb-6" />
        <LoadingState label="Loading departmental governance and oversight metrics..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell
        pageTitle="HOD Executive Command Center"
        pageSubtitle="Executive Plum: Departmental governance, faculty oversight, and safety review"
      >
        <TabsNav tabs={hodOverviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve HOD dashboard data'} onRetry={loadData} />
      </AppShell>
    );
  }

  const attendancePct = data.department_attendance_pct ?? 0;
  const isCompliant = attendancePct >= 75.0;

  return (
    <AppShell
      pageTitle="HOD Executive Command Center"
      pageSubtitle="Executive Plum: Department-level governance, faculty teaching oversight, and safety review"
    >
      {/* Contextual Tabs */}
      <TabsNav tabs={hodOverviewTabs} className="mb-6" />

      {/* =========================================================================
          EXECUTIVE HERO BANNER — EXECUTIVE PLUM IDENTITY
         ========================================================================= */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#2A0845] via-[#3B0764] to-[#581C87] text-white p-6 sm:p-8 lg:p-10 shadow-lg shadow-purple-950/20 border border-purple-800/60 overflow-hidden mb-6">
        <div
          className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute right-60 -bottom-20 w-64 h-64 rounded-full bg-indigo-500/15 blur-2xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-mono font-bold border border-purple-400/40 backdrop-blur-md">
                DEPARTMENT OF {data.department_name}
              </span>
              <span className="text-xs text-purple-300 font-mono">
                Academic Year 2026-2027 • Spring Term
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {data.hod_name}
              </h1>
              <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed font-normal">
                Head of Department & Professor of Computing. Complete administrative and pedagogical oversight
                across {data.total_faculty} faculty members and {data.total_students} enrolled students.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-mono font-semibold border border-white/15">
                {data.total_cameras} Monitored Classrooms
              </span>
              <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-mono font-semibold border border-white/15">
                {data.active_classes_count || 0} Classes In Progress
              </span>
            </div>
          </div>

          <div className="flex flex-wrap lg:flex-col items-center lg:items-end gap-3 self-stretch lg:self-auto justify-between lg:justify-start">
            {data.escalated_incidents_count > 0 ? (
              <NavLink
                to="/hod/safety"
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-900/40 transition-colors animate-pulse"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>{data.escalated_incidents_count} Escalations Pending Decision</span>
              </NavLink>
            ) : (
              <div className="px-3.5 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero Safety Escalations Active</span>
              </div>
            )}

            <NavLink
              to="/hod/camera-overview"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-2 transition-colors border border-white/15 backdrop-blur-md"
            >
              <Video className="w-4 h-4" />
              <span>Camera Network Health</span>
            </NavLink>
          </div>
        </div>
      </div>

      {/* =========================================================================
          KEY EXECUTIVE OVERVIEW METRICS
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricDisplay
          label="Department Attendance"
          value={`${attendancePct}%`}
          subvalue="Term weighted average across all cohorts"
          progressPct={attendancePct}
          progressTarget="75.0% min"
          icon={<CheckCircle2 className="w-5 h-5" />}
          highlight={true}
        />

        <MetricDisplay
          label="Teaching Faculty"
          value={data.total_faculty}
          subvalue="Assigned faculty conducting sessions"
          icon={<Users className="w-5 h-5 text-purple-700" />}
        />

        <MetricDisplay
          label="Enrolled Cohort"
          value={data.total_students}
          subvalue="Registered active students in department"
          icon={<Building className="w-5 h-5 text-indigo-700" />}
        />

        <MetricDisplay
          label="Camera System Health"
          value={`${data.camera_system_health_pct}%`}
          subvalue={`${data.total_cameras} Classroom sensors online`}
          trend={{ value: '100% feed uptime', positive: true, label: 'Dual-feed' }}
          icon={<Video className="w-5 h-5 text-emerald-700" />}
        />
      </div>

      {/* =========================================================================
          EXECUTIVE DOMAIN WORKSPACE CARDS
         ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Faculty Oversight */}
        <NavLink
          to="/hod/faculty-overview"
          className="bg-white p-6 rounded-2xl border border-slate-200 card-elevation card-elevation-hover transition-all flex flex-col justify-between group hover:border-purple-300"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-700 transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                Academic & Faculty Oversight
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Review individual faculty teaching loads, course syllabus completion, and attendance verification
                compliance.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
            <span>Inspect Faculty Roster</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </NavLink>

        {/* Safety & Incident Decisions */}
        <NavLink
          to="/hod/safety"
          className="bg-white p-6 rounded-2xl border border-slate-200 card-elevation card-elevation-hover transition-all flex flex-col justify-between group hover:border-rose-300"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <ShieldAlert className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-rose-800 transition-colors">
                Safety Escalations & Review
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Examine posture anomaly incidents escalated by faculty members and record formal executive administrative
                decisions.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-rose-600">
            <span>
              {data.escalated_incidents_count > 0
                ? `${data.escalated_incidents_count} Pending Review`
                : 'Incident History'}
            </span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </NavLink>

        {/* Institutional CSV Import Facility */}
        <NavLink
          to="/hod/import"
          className="bg-white p-6 rounded-2xl border border-slate-200 card-elevation card-elevation-hover transition-all flex flex-col justify-between group hover:border-purple-300"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="p-3 rounded-xl bg-slate-100 text-slate-800 group-hover:bg-purple-800 group-hover:text-white transition-colors">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-800 transition-colors" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 group-hover:text-purple-800 transition-colors">
                Institutional CSV Import
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Provision genuine institutional student cohorts, faculty assignments, subjects, and timetables via
                validated CSV templates.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-purple-700">
            <span>Manage Institutional Data</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </NavLink>
      </div>

      {/* =========================================================================
          RECENT IMMUTABLE AUDIT LOG STRIP
         ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200 card-elevation overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-700" />
            <h3 className="font-bold text-slate-900 text-base tracking-tight">
              Tamper-Evident Administrative Audit Log
            </h3>
          </div>
          <NavLink to="/hod/audit-logs" className="text-xs text-purple-700 hover:text-purple-900 font-bold">
            View Complete Audit Log →
          </NavLink>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">No recent administrative audit records.</div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {auditLogs.map((log: any) => (
              <div key={log.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                      {log.action}
                    </span>
                    <span className="text-slate-700 font-medium">{log.details}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Resource: {log.resource} • IP: {log.ip_address || 'system-internal'}
                  </div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 flex-shrink-0">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
