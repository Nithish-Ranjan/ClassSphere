import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Video, Activity, Shield, Smartphone, MessageSquare, Radio, CheckCircle2 } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { hodApi } from '../../services/api';

export const ClassIntelligenceView: React.FC = () => {
  const location = useLocation();
  const isActivity = location.pathname.includes('/hod/activity-overview');

  const [cameras, setCameras] = useState<any[]>([]);
  const [activityData, setActivityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([hodApi.getCameraOverview(), hodApi.getActivityOverview()]).then(([c, a]) => {
      setCameras(c);
      setActivityData(a);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const intelligenceTabs = [
    { name: 'Camera System Health', to: '/hod/camera-overview', icon: Video, badge: cameras.length },
    { name: 'Departmental Telemetry & Activity', to: '/hod/activity-overview', icon: Activity },
  ];

  if (loading) {
    return (
      <AppShell pageTitle="Class Intelligence & Cameras" pageSubtitle="Camera systems and departmental telemetry">
        <TabsNav tabs={intelligenceTabs} className="mb-6" />
        <LoadingState label="Loading camera health diagnostics and telemetry aggregation..." />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Class Intelligence & Cameras" pageSubtitle="Department-wide video stream health and telemetry aggregation">
      <TabsNav tabs={intelligenceTabs} className="mb-6" />

      {/* Privacy Pledge Banner (Executive Plum theme) */}
      <div className="bg-gradient-to-r from-[#2E0854] via-purple-900 to-[#1E1B4B] text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 border border-white/20">
            <Shield className="w-6 h-6 text-purple-200" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight text-white">Institutional Privacy Charter: Events Only. No Scores. No Labels.</div>
            <p className="text-xs text-purple-200/90 mt-1 leading-relaxed max-w-2xl">
              ClassSphere enforces strict institutional guardrails: objective telemetry event counts only. No individual personality profiles, engagement ranks, or behavioral grades are ever computed or stored.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-white/10 text-purple-100 border border-white/20 font-semibold self-start sm:self-auto">
          Departmental Oversight
        </span>
      </div>

      {isActivity ? (
        <div className="space-y-6">
          {/* Aggregated Event Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-800 flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Total Observed Detections</span>
                <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono">{activityData?.total_recorded_events || 0}</div>
                <span className="text-[10px] text-textSecondary">CSE Department overall</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Handling Events</span>
                <div className="text-2xl font-bold text-slate-900 mt-0.5 font-mono">{activityData?.phone_usage_events || 0}</div>
                <span className="text-[10px] text-textSecondary">Device handling detections</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50/70 border border-purple-100 text-purple-900 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Talking Displacements</span>
                <div className="text-2xl font-bold text-purple-950 mt-0.5 font-mono">{activityData?.talking_events || 0}</div>
                <span className="text-[10px] text-textSecondary">Optical motion estimates</span>
              </div>
            </div>
          </div>

          {/* Department Observability Notice */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm">
            <h3 className="font-bold text-textPrimary text-base mb-2">Departmental Aggregation Model</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              In accordance with educational oversight regulations, student activity counts are aggregated strictly by section and session.
              Faculty members review anomalies during their active sessions, and data is retained in accordance with institutional policy.
            </p>
          </div>
        </div>
      ) : (
        /* Camera System Health Table */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/60 to-purple-50/20">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Classroom Camera Systems Health</h3>
              <p className="text-xs text-textSecondary mt-0.5">Physical room feeds, frame rates, and ingestion pipelines</p>
            </div>
            <span className="text-xs font-mono text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 font-semibold">
              {cameras.length} Active Feeds
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Camera Identifier</th>
                  <th className="py-3 px-4">Classroom</th>
                  <th className="py-3 px-4">Operating Mode</th>
                  <th className="py-3 px-4">Stream Health</th>
                  <th className="py-3 px-4">Resolution & FPS</th>
                  <th className="py-3 px-4">Ingestion Interface</th>
                  <th className="py-3 px-4">Heartbeat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-textPrimary">
                {cameras.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-700" />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{c.room_number}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          c.mode === 'CONNECTED'
                            ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                            : 'bg-amber-50 text-brandWarning border border-amber-200'
                        }`}
                      >
                        {c.mode}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-brandSuccess font-bold text-[11px]">
                        <Radio className="w-3.5 h-3.5 animate-pulse" />
                        <span>{c.stream_health}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary">
                      {c.resolution} @ {c.fps} fps
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary font-mono text-[11px]">
                      {c.source_type}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary">
                      {new Date(c.last_heartbeat).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppShell>
  );
};
