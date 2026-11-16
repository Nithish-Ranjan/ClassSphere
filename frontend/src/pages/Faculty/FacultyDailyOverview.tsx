import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, UserCheck, LayoutDashboard, Sparkles } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { facultyApi } from '../../services/api';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge } from '../../components/ui';

export const FacultyDailyOverview: React.FC = () => {
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
      .getDailyOverview()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load faculty daily timeline.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Daily Teaching Schedule" pageSubtitle="Full daily chronological class timeline">
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <LoadingState label="Loading daily schedule timeline..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell pageTitle="Daily Teaching Schedule" pageSubtitle="Full daily chronological class timeline">
        <TabsNav tabs={facultyOverviewTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to retrieve daily schedule'} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Daily Teaching Schedule" pageSubtitle="Chronological timeline of assigned curriculum sessions">
      {/* Contextual Tabs */}
      <TabsNav tabs={facultyOverviewTabs} className="mb-6" />

      {/* Date Banner (Emerald Studio theme) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 border border-white/20">
            <Calendar className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/20 font-bold">
                OPERATIONAL TIMELINE
              </span>
              <span className="text-xs text-emerald-100 font-medium">Academic Year 2026-2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">{data.date}</h2>
            <p className="text-xs text-emerald-100/90 mt-0.5">Assigned to: {data.faculty_name}</p>
          </div>
        </div>
        <div className="text-xs font-mono px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold self-start sm:self-auto">
          {data.timeline?.length || 0} Scheduled Sessions
        </div>
      </div>

      {/* Timeline items */}
      {!data.timeline || data.timeline.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No Sessions Scheduled for Today"
          description="You have no assigned classes on the academic schedule for today's date."
          className="mt-6"
        />
      ) : (
        <div className="space-y-4 mt-6">
          {data.timeline.map((item: any) => (
            <div
              key={item.session_id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/40 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-24 text-center flex-shrink-0 pt-1">
                  <span className="text-sm font-bold text-slate-900 block font-mono">{item.scheduled_start}</span>
                  <span className="text-[11px] text-slate-500 font-mono">{item.scheduled_end}</span>
                </div>
                <div className="w-px h-12 bg-slate-200 self-center hidden sm:block" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-900 text-white">
                      {item.subject_code}
                    </span>
                    <span className="text-xs text-slate-600 font-semibold">
                      {item.section_name} • Room {item.room_number}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="text-base font-bold text-textPrimary">{item.subject_name}</h4>
                  <div className="text-xs text-textSecondary mt-0.5 flex items-center gap-2">
                    <span>Attendance: <span className="font-semibold text-emerald-700 font-mono">{item.attendance_percentage}%</span></span>
                    <span>•</span>
                    <span>{item.total_students} Enrolled Students</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 self-end md:self-center">
                <NavLink
                  to={`/faculty/class/${item.session_id}/dashboard`}
                  className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <span>Class Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
                <NavLink
                  to="/faculty/attendance/session"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Attendance</span>
                </NavLink>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
};
