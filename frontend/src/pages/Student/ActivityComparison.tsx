import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { BarChart2, TrendingDown, TrendingUp, Smartphone, MessageSquare, Activity, ShieldCheck, Video, Users } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi } from '../../services/api';
import { ActivityComparisonData } from '../../types';
import { LoadingState, ErrorState, TabsNav, Card } from '../../components/ui';

export const ActivityComparisonView: React.FC = () => {
  const [data, setData] = useState<ActivityComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const isFaculty = location.pathname.startsWith('/faculty');

  const tabs = isFaculty
    ? [
        { name: 'Live Classroom Feed', to: '/faculty/live-classroom', icon: Video },
        { name: 'Individual Activity', to: '/faculty/activity/individual', icon: Users },
        { name: 'Activity Comparison', to: '/faculty/activity/comparison', icon: BarChart2 },
      ]
    : [
        { name: 'My Classroom Activity', to: '/student/activity', icon: Activity },
        { name: 'Activity Comparison', to: '/student/activity/comparison', icon: BarChart2 },
      ];

  const loadData = () => {
    setLoading(true);
    setError(null);
    studentApi
      .getActivityComparison()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to compute activity comparison telemetry.');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <AppShell pageTitle="Activity Comparison" pageSubtitle="Objective comparison of recorded classroom telemetry between periods">
        <TabsNav tabs={tabs} className="mb-6" />
        <LoadingState label="Analyzing period-over-period telemetry deltas..." />
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell pageTitle="Activity Comparison" pageSubtitle="Objective comparison of recorded classroom telemetry between periods">
        <TabsNav tabs={tabs} className="mb-6" />
        <ErrorState message={error || 'Unable to load comparison data'} onRetry={loadData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Activity Comparison" pageSubtitle="Objective comparison of recorded classroom telemetry between periods">
      {/* Contextual Tabs */}
      <TabsNav tabs={tabs} className="mb-6" />

      {/* Mode & Period Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-role-primary font-bold uppercase tracking-wider">{data.period_label}</span>
          <h2 className="text-base sm:text-lg font-bold text-textPrimary mt-0.5">Telemetry Period Comparison</h2>
          <p className="text-xs text-textSecondary mt-0.5 leading-relaxed max-w-xl">
            Comparative counts for verified observable classroom events. Objectively computed from stored database records without subjective interpretation.
          </p>
        </div>
        <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-semibold self-start sm:self-auto">
          MODE: SIMULATED BENCHMARK DATA
        </span>
      </div>

      {/* Main Comparisons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Phone Usage Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-aurora-cobalt border border-blue-100">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-textPrimary">Phone Handling Detections</h3>
                <span className="text-[11px] text-textSecondary">Observable handheld interactions</span>
              </div>
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-bold font-mono ${
                data.phone_pct_change <= 0 ? 'text-brandSuccess' : 'text-brandDanger'
              }`}
            >
              {data.phone_pct_change <= 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : (
                <TrendingUp className="w-4 h-4" />
              )}
              <span>{Math.abs(data.phone_pct_change)}% {data.phone_pct_change <= 0 ? 'reduction' : 'increase'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-xs text-textSecondary">Previous Period</span>
              <div className="text-3xl font-bold text-textPrimary mt-1 font-mono">{data.previous_phone_events}</div>
              <span className="text-[10px] text-textSecondary">Baseline period</span>
            </div>
            <div className="p-4 rounded-xl bg-blue-50/60 border border-aurora-cobalt/30 text-center">
              <span className="text-xs text-aurora-cobalt font-semibold">Current Period</span>
              <div className="text-3xl font-bold text-aurora-cobalt mt-1 font-mono">{data.current_phone_events}</div>
              <span className="text-[10px] text-aurora-indigo font-medium">Recent active period</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-textSecondary flex justify-between items-center">
            <span>Observable trend across lecture sessions</span>
            <span className="font-semibold text-brandSuccess">Favorable Trajectory</span>
          </div>
        </div>

        {/* Talking Events Comparison */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-aurora-indigo border border-indigo-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-textPrimary">Talking Displacements</h3>
                <span className="text-[11px] text-textSecondary">Mouth motion optical flow estimation</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-textSecondary font-mono">
              <TrendingUp className="w-4 h-4" />
              <span>{Math.abs(data.talking_pct_change)}% change</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
              <span className="text-xs text-textSecondary">Previous Period</span>
              <div className="text-3xl font-bold text-textPrimary mt-1 font-mono">{data.previous_talking_events}</div>
              <span className="text-[10px] text-textSecondary">Baseline period</span>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-aurora-indigo/30 text-center">
              <span className="text-xs text-aurora-indigo font-semibold">Current Period</span>
              <div className="text-3xl font-bold text-aurora-indigo mt-1 font-mono">{data.current_talking_events}</div>
              <span className="text-[10px] text-aurora-indigo font-medium">Recent active period</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-xs text-textSecondary flex justify-between items-center">
            <span>Conversational optical flow events</span>
            <span className="font-semibold text-slate-700">Stable Activity</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
