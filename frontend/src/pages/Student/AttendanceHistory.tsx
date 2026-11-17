import React, { useState, useEffect } from 'react';
import { Calendar, CheckCircle, CheckCircle2, Clock, Camera, FileCheck2, ShieldCheck, History } from 'lucide-react';
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
      .catch(() => {
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

      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-blue-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-aurora-cobalt/10 text-aurora-cobalt flex items-center justify-center flex-shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-textPrimary text-base">Recorded Attendance Sessions</h3>
              <p className="text-xs text-textSecondary mt-0.5">
                Verified multi-modal identity matching and faculty audit logs
              </p>
            </div>
          </div>
          <span className="text-xs font-mono text-aurora-cobalt bg-aurora-sky/15 px-3 py-1.5 rounded-lg border border-aurora-cobalt/20 font-semibold self-start sm:self-auto">
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
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
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
                  <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">
                      <span className="text-textPrimary">{rec.subject_name}</span>
                      <span className="block text-[11px] font-mono text-aurora-cobalt font-medium">{rec.subject_code}</span>
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary font-mono">{rec.room_number}</td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary text-[11px]">
                      {new Date(rec.marked_at).toLocaleDateString()}{' '}
                      <span className="text-slate-400">
                        {new Date(rec.marked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={rec.status} />
                    </td>
                    <td className="py-3.5 px-4">
                      {rec.verified_by_photo ? (
                        <span className="inline-flex items-center gap-1.5 text-aurora-cobalt font-medium">
                          <Camera className="w-3.5 h-3.5" />
                          <span>Facial Match</span>
                        </span>
                      ) : rec.manual_override ? (
                        <span className="inline-flex items-center gap-1.5 text-aurora-indigo font-medium">
                          <FileCheck2 className="w-3.5 h-3.5" />
                          <span>Faculty Override</span>
                        </span>
                      ) : (
                        <span className="text-textSecondary">Challenge Code</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {rec.confidence_score ? (
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-800">
                          {(rec.confidence_score * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
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
