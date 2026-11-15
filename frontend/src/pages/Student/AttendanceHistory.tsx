import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Calculator, CheckCircle2, Clock, Camera, FileCheck2 } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge } from '../../components/ui';

export const AttendanceHistoryView: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
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
      .getAttendanceHistory()
      .then((data) => {
        setHistory(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load historical attendance transcripts.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Attendance History" pageSubtitle="Historical chronological records of session attendance">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <LoadingState label="Loading historical attendance records from PostgreSQL..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="Attendance History" pageSubtitle="Historical chronological records of session attendance">
        <TabsNav tabs={attendanceTabs} className="mb-6" />
        <ErrorState message={error} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Attendance History" pageSubtitle="Historical chronological records of session attendance">
      {/* Contextual Tabs */}
      <TabsNav tabs={attendanceTabs} className="mb-6" />

      <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Recorded Attendance Sessions</h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Verified multi-modal identity matching and manual audit logs
            </p>
          </div>
          <span className="text-xs font-mono text-slate-600 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
            {history.length} Sessions Logged
          </span>
        </div>

        {history.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No Attendance Sessions Recorded"
            description="No finalized attendance sessions have been logged for your account yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Subject & Code</th>
                  <th className="py-3 px-4">Room</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Attendance Status</th>
                  <th className="py-3 px-4">Verification Method</th>
                  <th className="py-3 px-4">Match Confidence</th>
                  <th className="py-3 px-4">Audit Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-textPrimary">
                {history.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">
                      {rec.subject_name}
                      <span className="block text-[11px] font-mono text-textSecondary">{rec.subject_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary">{rec.room_number}</td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary">
                      {new Date(rec.marked_at).toLocaleDateString()}{' '}
                      {new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.verified_by_photo ? (
                        <span className="inline-flex items-center gap-1.5 text-teal font-medium">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Facial Match</span>
                        </span>
                      ) : rec.manual_override ? (
                        <span className="inline-flex items-center gap-1.5 text-[#183B5B] font-medium">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Faculty Override</span>
                        </span>
                      ) : (
                        <span className="text-textSecondary">Challenge Code</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {rec.confidence_score ? `${(rec.confidence_score * 100).toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary italic text-[11px]">
                      {rec.override_reason || 'Automated multi-modal verification'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
};
