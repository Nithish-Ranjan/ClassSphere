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

      {/* Privacy Pledge Banner */}
      <div className="bg-navy text-white p-5 rounded-xl border border-navy-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center text-white flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Institutional Privacy: Events Only. No Scores. No Labels.</div>
            <p className="text-xs text-mutedBlue-dark mt-0.5">
              ClassSphere enforces strict privacy guardrails: objective telemetry counts only. No personality profiles or behavioral grades are ever stored.
            </p>
          </div>
        </div>
      </div>

      {isActivity ? (
        <div className="space-y-6">
          {/* Aggregated Event Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-surface border border-mutedBlue text-navy flex items-center justify-center flex-shrink-0">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Total Observed Detections</span>
                <div className="text-2xl font-bold text-textPrimary mt-0.5">{activityData?.total_recorded_events || 0}</div>
                <span className="text-[10px] text-textSecondary">CSE Department overall</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-darkBlue flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Phone Handling Events</span>
                <div className="text-2xl font-bold text-textPrimary mt-0.5">{activityData?.phone_usage_events || 0}</div>
                <span className="text-[10px] text-textSecondary">Device handling detections</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-mutedBlue card-elevation flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-light text-teal flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Talking Displacements</span>
                <div className="text-2xl font-bold text-textPrimary mt-0.5">{activityData?.talking_events || 0}</div>
                <span className="text-[10px] text-textSecondary">Optical motion estimates</span>
              </div>
            </div>
          </div>

          {/* Department Observability Notice */}
          <div className="bg-white p-6 rounded-xl border border-mutedBlue card-elevation">
            <h3 className="font-bold text-textPrimary text-base mb-2">Departmental Aggregation Model</h3>
            <p className="text-xs text-textSecondary leading-relaxed">
              In accordance with educational oversight regulations, student activity counts are aggregated by section and session.
              Faculty members review anomalies during their active sessions, and data is retained in accordance with institutional policy.
            </p>
          </div>
        </div>
      ) : (
        /* Camera System Health Table */
        <div className="bg-white rounded-xl border border-mutedBlue card-elevation overflow-hidden">
          <div className="p-5 border-b border-mutedBlue flex items-center justify-between">
            <div>
              <h3 className="font-bold text-textPrimary text-base">Classroom Camera Systems Health</h3>
              <p className="text-xs text-textSecondary mt-0.5">Physical room feeds, frame rates, and ingestion pipelines</p>
            </div>
            <span className="text-xs font-mono text-textSecondary bg-surface px-2.5 py-1 rounded border border-mutedBlue">
              {cameras.length} Active Feeds
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-mutedBlue">
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
              <tbody className="divide-y divide-mutedBlue text-textPrimary">
                {cameras.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-navy flex items-center gap-2">
                      <Video className="w-4 h-4 text-teal" />
                      <span>{c.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold">{c.room_number}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
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
