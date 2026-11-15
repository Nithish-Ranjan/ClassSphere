import React, { useState, useEffect } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import { FileText, Clock, ArrowLeft, ShieldCheck, CheckCircle2, BookOpen, LayoutDashboard } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { facultyApi } from '../../services/api';
import { LoadingState, ErrorState, EmptyState, TabsNav } from '../../components/ui';

export const ClassLogView: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const id = classId ? parseInt(classId, 10) : 1;
  const [logs, setLogs] = useState<any[]>([]);
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
      .getClassLogs(id)
      .then((res) => {
        setLogs(res);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load session logs.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return (
      <AppShell pageTitle="Class Session Log" pageSubtitle="Audit-grade chronological event timeline for the session">
        <TabsNav tabs={classroomTabs} className="mb-6" />
        <LoadingState label="Loading audit-grade chronological class logs..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="Class Session Log" pageSubtitle="Audit-grade chronological event timeline for the session">
        <TabsNav tabs={classroomTabs} className="mb-6" />
        <ErrorState message={error} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Class Session Log" pageSubtitle="Audit-grade chronological event timeline for the session">
      {/* Contextual Tabs */}
      <TabsNav tabs={classroomTabs} className="mb-6" />

      <div className="bg-white rounded-xl border border-slate-200 p-6 card-elevation space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <NavLink
              to={`/faculty/class/${id}/dashboard`}
              className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-textSecondary transition-colors border border-slate-200"
              title="Return to Class Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </NavLink>
            <div>
              <h2 className="text-base font-bold text-textPrimary">Chronological Event Timeline</h2>
              <p className="text-xs text-textSecondary">Recorded events from system sensors, camera feeds, and faculty actions</p>
            </div>
          </div>
          <span className="text-xs font-mono px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            Session ID: #{id}
          </span>
        </div>

        {logs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No Logs Recorded for this Session"
            description="No system or faculty events have been logged for this class session yet."
          />
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {logs.map((log) => (
              <div key={log.id} className="relative">
                <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-teal ring-4 ring-white" />
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#10233F] font-mono uppercase tracking-wide">
                      {log.event_type}
                    </span>
                    <span className="text-[11px] font-mono text-textSecondary">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-textPrimary leading-relaxed mt-1">{log.description}</p>
                  <div className="pt-2 flex items-center gap-2 text-[10px] text-textSecondary font-mono">
                    <span className="px-2 py-0.5 rounded bg-white border border-slate-200 uppercase font-semibold">
                      Source: {log.source}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};
