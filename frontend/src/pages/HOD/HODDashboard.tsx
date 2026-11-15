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
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { LoadingState } from '../../components/ui/LoadingState';
import { hodApi } from '../../services/api';

export const HODDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hodApi.getDashboard().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="HOD Executive Dashboard" pageSubtitle="Departmental academic and administrative oversight">
        <LoadingState label="Loading departmental governance and oversight metrics..." />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="HOD Executive Dashboard" pageSubtitle="Department-level governance, faculty oversight, and safety review">
      {/* Top Banner */}
      <div className="bg-navy text-white rounded-xl p-6 border border-navy-light shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded bg-teal/20 text-teal-light text-xs font-mono font-bold border border-teal/30">
              DEPARTMENT OF {data?.department_name}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{data?.hod_name}</h2>
          <p className="text-xs text-mutedBlue-dark mt-0.5">Head of Department • Executive Oversight Portal</p>
        </div>

        <div className="flex items-center gap-3">
          {data?.escalated_incidents_count > 0 && (
            <NavLink
              to="/hod/safety"
              className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>{data.escalated_incidents_count} Escalated Incidents</span>
            </NavLink>
          )}
          <NavLink
            to="/hod/camera-overview"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors border border-white/10"
          >
            <Video className="w-4 h-4" />
            <span>Camera Health</span>
          </NavLink>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Department Attendance</span>
            <CheckCircle2 className="w-4 h-4 text-teal" />
          </div>
          <div className="text-3xl font-bold text-textPrimary">{data?.department_attendance_pct}%</div>
          <p className="text-[11px] text-textSecondary mt-2">Term average across all CSE sections</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Faculty Staff</span>
            <Users className="w-4 h-4 text-darkBlue" />
          </div>
          <div className="text-3xl font-bold text-textPrimary">{data?.total_faculty}</div>
          <p className="text-[11px] text-textSecondary mt-2">Active teaching faculty in department</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Enrolled Students</span>
            <Users className="w-4 h-4 text-navy" />
          </div>
          <div className="text-3xl font-bold text-textPrimary">{data?.total_students}</div>
          <p className="text-[11px] text-textSecondary mt-2">Current enrolled semester cohorts</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation">
          <div className="flex items-center justify-between text-xs font-semibold text-textSecondary uppercase tracking-wider mb-2">
            <span>Camera System Health</span>
            <Video className="w-4 h-4 text-brandSuccess" />
          </div>
          <div className="text-3xl font-bold text-brandSuccess">{data?.camera_system_health_pct}%</div>
          <p className="text-[11px] text-textSecondary mt-2">{data?.total_cameras} Active Classrooms Online</p>
        </div>
      </div>

      {/* Department Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <NavLink
          to="/hod/faculty-overview"
          className="bg-white p-6 rounded-xl border border-mutedBlue card-elevation card-elevation-hover transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-lg bg-blue-50 text-darkBlue group-hover:bg-darkBlue group-hover:text-white transition-colors">
                <Users className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-textSecondary group-hover:text-teal transition-colors" />
            </div>
            <h3 className="text-base font-bold text-textPrimary group-hover:text-teal transition-colors">
              Faculty Workload & Overview
            </h3>
            <p className="text-xs text-textSecondary mt-1">
              Review individual faculty teaching assignments, class completion metrics, and attendance compliance.
            </p>
          </div>
        </NavLink>

        <NavLink
          to="/hod/safety"
          className="bg-white p-6 rounded-xl border border-mutedBlue card-elevation card-elevation-hover transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-lg bg-red-50 text-brandDanger group-hover:bg-brandDanger group-hover:text-white transition-colors">
                <AlertTriangle className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-textSecondary group-hover:text-brandDanger transition-colors" />
            </div>
            <h3 className="text-base font-bold text-textPrimary group-hover:text-brandDanger transition-colors">
              Safety Escalation Review
            </h3>
            <p className="text-xs text-textSecondary mt-1">
              Examine incidents escalated by faculty members and record executive administrative decisions.
            </p>
          </div>
        </NavLink>

        <NavLink
          to="/hod/audit-logs"
          className="bg-white p-6 rounded-xl border border-mutedBlue card-elevation card-elevation-hover transition-all flex flex-col justify-between group"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="p-2.5 rounded-lg bg-surface text-navy group-hover:bg-navy group-hover:text-white transition-colors border border-mutedBlue">
                <FileText className="w-5 h-5" />
              </span>
              <ArrowRight className="w-4 h-4 text-textSecondary group-hover:text-navy transition-colors" />
            </div>
            <h3 className="text-base font-bold text-textPrimary group-hover:text-navy transition-colors">
              Security & System Audit Logs
            </h3>
            <p className="text-xs text-textSecondary mt-1">
              Complete tamper-evident audit logs of logins, overrides, escalations, and system events.
            </p>
          </div>
        </NavLink>
      </div>
    </AppShell>
  );
};
