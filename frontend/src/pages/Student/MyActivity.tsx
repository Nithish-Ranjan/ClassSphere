import React, { useState, useEffect } from 'react';
import { Smartphone, MessageSquare, Shield, Clock, Info, CheckCircle2, Activity, BarChart2, EyeOff } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { LoadingState, ErrorState, EmptyState, TabsNav, StatusBadge } from '../../components/ui';

export const MyActivityView: React.FC = () => {
  const [activityData, setActivityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const insightsTabs = [
    { name: 'My Classroom Activity', to: '/student/activity', icon: Activity },
    { name: 'Activity Comparison', to: '/student/activity/comparison', icon: BarChart2 },
  ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    studentApi
      .getMyActivity()
      .then((data) => {
        setActivityData(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load telemetry event history.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="My Classroom Activity" pageSubtitle="Observable telemetry events for individual student sessions">
        <TabsNav tabs={insightsTabs} className="mb-6" />
        <LoadingState label="Loading objective classroom activity telemetry..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="My Classroom Activity" pageSubtitle="Observable telemetry events for individual student sessions">
        <TabsNav tabs={insightsTabs} className="mb-6" />
        <ErrorState message={error} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="My Classroom Activity" pageSubtitle="Observable telemetry events for individual student sessions">
      {/* Contextual Tabs */}
      <TabsNav tabs={insightsTabs} className="mb-6" />

      {/* Mandatory Privacy Guarantee Banner (Aurora styling) */}
      <div className="bg-gradient-to-r from-aurora-cobalt to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 border border-white/20">
            <Shield className="w-6 h-6 text-blue-200" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              <span>ClassSphere Privacy Charter: Events Only. No Scores. No Disciplinary Labels.</span>
            </div>
            <p className="text-xs text-blue-100/90 mt-1 leading-relaxed max-w-2xl">
              ClassSphere captures strictly observable physical events (such as hand-held device interaction) for operational monitoring. The system never computes personality metrics, subjective engagement ratings, or automated disciplinary labels.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono uppercase px-3 py-1.5 rounded-lg bg-white/10 text-blue-100 border border-white/20 whitespace-nowrap self-start sm:self-auto font-semibold">
          Objective Auditing
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mt-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-aurora-cobalt flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Usage Events</span>
            <div className="text-2xl font-bold text-textPrimary mt-0.5 font-mono">{activityData?.phone_events_count || 0}</div>
            <span className="text-[11px] text-textSecondary">Recorded during active lecture</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-aurora-indigo flex items-center justify-center flex-shrink-0 border border-indigo-100">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Talking Estimates</span>
            <div className="text-2xl font-bold text-aurora-indigo mt-0.5 font-mono">{activityData?.talking_events_count || 0}</div>
            <span className="text-[11px] text-textSecondary">Mouth displacement optical flow</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center flex-shrink-0 border border-slate-200">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Total Telemetry Events</span>
            <div className="text-2xl font-bold text-textPrimary mt-0.5 font-mono">{activityData?.total_recorded_events || 0}</div>
            <span className="text-[11px] text-textSecondary">Current semester sessions</span>
          </div>
        </div>
      </div>

      {/* Event Records Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mt-6">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 to-blue-50/20">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Recorded Telemetry Timeline</h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Every event retains model confidence, camera pipeline version, and faculty verification state
            </p>
          </div>
          <span className="text-xs font-mono text-aurora-cobalt bg-aurora-sky/15 px-3 py-1 rounded-lg border border-aurora-cobalt/20 font-semibold self-start sm:self-auto">
            {activityData?.events?.length || 0} Events Logged
          </span>
        </div>

        {!activityData?.events || activityData.events.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="No Telemetry Events Recorded"
            description="No observable device handling or talking events have been detected for your profile."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Detection Confidence</th>
                  <th className="py-3 px-4">Model Pipeline</th>
                  <th className="py-3 px-4">Review State</th>
                  <th className="py-3 px-4">Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-textPrimary">
                {activityData.events.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        {ev.event_type === 'PHONE_USAGE' ? (
                          <span className="inline-flex items-center gap-1.5 text-aurora-cobalt">
                            <Smartphone className="w-3.5 h-3.5" />
                            <span>Phone Usage</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-aurora-indigo">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Talking</span>
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary text-[11px]">
                      {new Date(ev.timestamp).toLocaleDateString()}{' '}
                      <span className="text-slate-400">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold text-slate-800">
                        {(ev.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary text-[11px]">{ev.model_version}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ev.review_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                        {ev.is_simulated ? 'SIMULATED' : 'LIVE'}
                      </span>
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
