import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, BookOpen, AlertTriangle, CheckCircle2, TrendingUp, Award } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { SubjectAttendance } from '../../types';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge, Card, CardHeader, CardContent } from '../../components/ui';

export const SubjectAttendanceView: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attendanceTabs = [
    { name: 'Subject-wise Attendance', to: '/student/attendance/subject-wise', icon: CheckCircle },
    { name: 'Attendance History', to: '/student/attendance/history', icon: Calendar },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    studentApi
      .getSubjectWiseAttendance()
      .then((data) => {
        setSubjects(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load subject-wise attendance records.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Subject-wise Attendance" pageSubtitle="Attendance metrics computed from verified session records">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <LoadingState label="Computing subject-wise attendance transcripts..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="Subject-wise Attendance" pageSubtitle="Attendance metrics computed from verified session records">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <ErrorState message={error} onRetry={loadData} />
      </AppShell>
    );
  }

  // Calculate overall statistics
  const totalConducted = subjects.reduce((acc, s) => acc + s.classes_conducted, 0);
  const totalAttended = subjects.reduce((acc, s) => acc + s.classes_attended, 0);
  const overallPct = totalConducted > 0 ? ((totalAttended / totalConducted) * 100).toFixed(1) : '0.0';
  const onTrackCount = subjects.filter((s) => s.attendance_percentage >= 75.0).length;

  return (
    <AppShell pageTitle="Subject-wise Attendance" pageSubtitle="Attendance metrics computed from verified session records">
      {/* Contextual Tabs */}
      <TabsNav tabs={attendanceTabs} className="mb-6" />

      {/* Hero Overview Banner (Aurora styling) */}
      <div className="bg-gradient-to-r from-aurora-cobalt via-aurora-indigo to-blue-700 text-white p-6 rounded-2xl shadow-md mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/20 text-white backdrop-blur-sm border border-white/25">
              SEMESTER 6 CURRICULAR COHORT
            </span>
            <span className="text-xs text-blue-100 font-medium">B.Tech Computer Science</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Course Attendance Portfolio</h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xl leading-relaxed">
            Institutional requirement is <span className="font-semibold text-white">75.0%</span> in each enrolled course for end-semester examination eligibility. All percentages are computed from immutable verification logs.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-5 py-3.5 rounded-xl border border-white/20 flex-shrink-0">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-blue-100 block font-semibold">Aggregate Rate</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono mt-0.5">{overallPct}%</div>
            <span className="text-[11px] text-blue-200 mt-0.5 block">{onTrackCount} of {subjects.length} courses compliant</span>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
        </div>
      </div>

      {subjects.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Course Enrollments Found"
          description="Your profile currently has no active subject enrollments for the current semester."
        />
      ) : (
        /* Subject Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {subjects.map((s) => {
            const isGood = s.attendance_percentage >= 75.0;
            return (
              <div
                key={s.subject_id}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 hover:border-aurora-cobalt/40 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono font-bold text-aurora-cobalt px-2.5 py-0.5 rounded-md bg-aurora-sky/15 border border-aurora-cobalt/20">
                          {s.subject_code}
                        </span>
                        <span className="text-[11px] text-textSecondary font-medium">
                          {s.credits} Credits
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-textPrimary mt-1.5">{s.subject_name}</h3>
                      <div className="text-xs text-textSecondary mt-0.5">
                        Faculty: <span className="font-medium text-slate-700">{s.faculty_name}</span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                        s.status === 'ON_TRACK'
                          ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                          : s.status === 'AT_RISK'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-red-50 text-brandDanger border border-red-200'
                      }`}
                    >
                      {s.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-textSecondary font-medium">Recorded Attendance</span>
                      <span className={`font-bold font-mono text-sm ${isGood ? 'text-aurora-cobalt' : 'text-brandDanger'}`}>
                        {s.attendance_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/60">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-gradient-to-r from-aurora-cobalt to-aurora-sky' : 'bg-brandDanger'
                        }`}
                        style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-3 gap-2.5 mt-5 pt-4 border-t border-slate-100 text-center">
                    <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100">
                      <div className="text-[11px] text-textSecondary font-medium">Conducted</div>
                      <div className="text-sm font-bold text-textPrimary mt-0.5 font-mono">{s.classes_conducted}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/60">
                      <div className="text-[11px] text-emerald-800 font-medium">Attended</div>
                      <div className="text-sm font-bold text-brandSuccess mt-0.5 font-mono">{s.classes_attended}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-red-50/60 border border-red-100/60">
                      <div className="text-[11px] text-red-800 font-medium">Missed</div>
                      <div className="text-sm font-bold text-brandDanger mt-0.5 font-mono">{s.classes_missed}</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-textSecondary">
                  <span>Threshold: 75.0% required</span>
                  <span className={`font-semibold ${isGood ? 'text-brandSuccess' : 'text-brandDanger'}`}>
                    {isGood ? '✓ Hall ticket eligible' : '⚠ Below margin'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};
