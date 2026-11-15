import React, { useState, useEffect } from 'react';
import { CheckCircle, Calendar, Calculator, BookOpen, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { SubjectAttendance } from '../../types';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge, Card } from '../../components/ui';

export const SubjectAttendanceView: React.FC = () => {
  const [subjects, setSubjects] = useState<SubjectAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const attendanceTabs = [
    { name: 'Subject-wise Attendance', to: '/student/attendance/subject-wise', icon: CheckCircle },
    { name: 'Attendance History', to: '/student/attendance/history', icon: Calendar },
    { name: 'What If Simulator', to: '/student/what-if', icon: Calculator },
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
      .catch((err) => {
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

  return (
    <AppShell pageTitle="Subject-wise Attendance" pageSubtitle="Attendance metrics computed from verified session records">
      {/* Contextual Tabs */}
      <TabsNav tabs={attendanceTabs} className="mb-6" />

      {/* Header Info */}
      <div className="bg-white p-5 sm:p-6 rounded-xl border border-slate-200 card-elevation flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-textPrimary tracking-tight">
            Enrolled Curricular Courses (Semester 6)
          </h2>
          <p className="text-xs text-textSecondary mt-0.5 leading-relaxed">
            Minimum required institutional attendance is <span className="font-semibold text-textPrimary">75.0%</span> for end-semester examination hall ticket eligibility.
          </p>
        </div>
        <div className="text-[11px] font-mono text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Source: Verified PostgreSQL Records
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
                className="bg-white p-6 rounded-xl border border-slate-200 card-elevation flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-teal px-2 py-0.5 rounded bg-[#E6F6F5]">
                        {s.subject_code}
                      </span>
                      <h3 className="text-base font-bold text-textPrimary mt-1.5">{s.subject_name}</h3>
                      <div className="text-xs text-textSecondary mt-0.5">
                        {s.faculty_name} • {s.credits} Credits
                      </div>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
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
                      <span className="text-textSecondary">Attendance Percentage</span>
                      <span className="font-bold text-textPrimary text-sm font-mono">
                        {s.attendance_percentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isGood ? 'bg-teal' : 'bg-brandDanger'
                        }`}
                        style={{ width: `${Math.min(s.attendance_percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics Breakdown */}
                  <div className="grid grid-cols-3 gap-2 mt-5 pt-4 border-t border-slate-100 text-center">
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-textSecondary">Conducted</div>
                      <div className="text-sm font-bold text-textPrimary mt-0.5 font-mono">{s.classes_conducted}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-textSecondary">Attended</div>
                      <div className="text-sm font-bold text-brandSuccess mt-0.5 font-mono">{s.classes_attended}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[11px] text-textSecondary">Missed</div>
                      <div className="text-sm font-bold text-brandDanger mt-0.5 font-mono">{s.classes_missed}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppShell>
  );
};
