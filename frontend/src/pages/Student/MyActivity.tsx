import React, { useState, useEffect } from 'react';
import { Smartphone, MessageSquare, Shield, Clock, Info, CheckCircle2, Activity, BarChart2 } from 'lucide-react';
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
      .catch((err) => {
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

      {/* Mandatory Privacy Guarantee Banner */}
      <div className="bg-[#10233F] text-white p-5 sm:p-6 rounded-xl border border-[#1A3358] shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center text-white flex-shrink-0 shadow-xs">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white">
              Institutional Privacy: Events Only. No Scores. No Labels.
            </div>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              ClassSphere captures observable events strictly for operational monitoring. The system never computes personality ratings, engagement scores, or automated disciplinary labels.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded bg-white/10 text-[#E6F6F5] border border-white/15 whitespace-nowrap">
          Objective Auditing
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#183B5B] flex items-center justify-center flex-shrink-0 border border-[#BFDBFE]/50">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Usage Events</span>
            <div className="text-2xl font-bold text-textPrimary mt-0.5 font-mono">{activityData?.phone_events_count || 0}</div>
            <span className="text-[11px] text-textSecondary">Recorded during active lecture</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#E6F6F5] text-teal flex items-center justify-center flex-shrink-0 border border-teal/20">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Talking Estimates</span>
            <div className="text-2xl font-bold text-teal mt-0.5 font-mono">{activityData?.talking_events_count || 0}</div>
            <span className="text-[11px] text-textSecondary">Mouth displacement optical flow</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 card-elevation flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-slate-50 text-[#10233F] flex items-center justify-center flex-shrink-0 border border-slate-200">
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
      <div className="bg-white rounded-xl border border-slate-200 card-elevation overflow-hidden mt-6">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Recorded Telemetry Timeline</h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Every event retains model confidence, camera pipeline version, and faculty review status
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-3 py-1 rounded-lg border border-slate-200">
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
              <thead className="bg-slate-50 text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
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
                  <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-semibold">
                      <span className="inline-flex items-center gap-2">
                        {ev.event_type === 'PHONE_USAGE' ? (
                          <Smartphone className="w-3.5 h-3.5 text-[#183B5B]" />
                        ) : (
                          <MessageSquare className="w-3.5 h-3.5 text-teal" />
                        )}
                        <span>{ev.event_type.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary">
                      {new Date(ev.timestamp).toLocaleDateString()}{' '}
                      {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-bold">
                        {(ev.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary text-[11px]">{ev.model_version}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={ev.review_status} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
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
