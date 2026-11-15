import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, ArrowRight, UserCheck, LayoutDashboard } from 'lucide-react';
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
      .catch((err) => {
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

      {/* Date Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#E6F6F5] text-teal">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-textPrimary tracking-tight">{data.date}</h2>
            <p className="text-xs text-textSecondary">{data.faculty_name} • Academic Year 2026-2027</p>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600">
          {data.timeline?.length || 0} Scheduled Sessions
        </span>
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
              className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 card-elevation flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-24 text-center flex-shrink-0">
                  <span className="text-sm font-bold text-textPrimary block font-mono">{item.scheduled_start}</span>
                  <span className="text-[11px] text-textSecondary font-mono">{item.scheduled_end}</span>
                </div>
                <div className="w-px h-12 bg-slate-200 self-center hidden sm:block" />
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-[#10233F] text-white">
                      {item.subject_code}
                    </span>
                    <span className="text-xs text-textSecondary font-semibold">
                      {item.section_name} • {item.room_number}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <h4 className="text-base font-bold text-textPrimary">{item.subject_name}</h4>
                  <div className="text-xs text-textSecondary mt-0.5 flex items-center gap-2">
                    <span>Attendance: <span className="font-semibold text-textPrimary">{item.attendance_percentage}%</span></span>
                    <span>•</span>
                    <span>{item.total_students} Enrolled Students</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <NavLink
                  to={`/faculty/class/${item.session_id}/dashboard`}
                  className="px-3.5 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-textPrimary text-xs font-semibold flex items-center gap-1.5 transition-colors border border-slate-200 cursor-pointer"
                >
                  <span>Class Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </NavLink>
                <NavLink
                  to="/faculty/attendance/session"
                  className="px-3.5 py-2 rounded-lg bg-teal hover:bg-teal-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-subtle cursor-pointer"
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
