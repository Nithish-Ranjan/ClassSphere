import React, { useState, useEffect } from 'react';
import { Smartphone, MessageSquare, Shield, Clock, Search, Video, Users, BarChart2 } from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { TabsNav } from '../../components/ui/TabsNav';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { eventApi } from '../../services/api';
import { StudentActivitySummary } from '../../types';

export const IndividualActivityView: React.FC = () => {
  const [summaries, setSummaries] = useState<StudentActivitySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const classSessionId = 1;

  const intelligenceTabs = [
    { name: 'Live Classroom Feed', to: '/faculty/live-classroom', icon: Video },
    { name: 'Individual Activity', to: '/faculty/activity/individual', icon: Users },
    { name: 'Activity Comparison', to: '/faculty/activity/comparison', icon: BarChart2 },
  ];

  useEffect(() => {
    eventApi.getIndividualSummary(classSessionId).then((data) => {
      setSummaries(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = summaries.filter(
    (s) =>
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppShell pageTitle="Individual Student Activity Table" pageSubtitle="Observable telemetry events for assigned section students">
      <TabsNav tabs={intelligenceTabs} className="mb-6" />

      {/* Privacy Pledge Banner (Emerald Studio theme) */}
      <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white flex-shrink-0 border border-white/20">
            <Shield className="w-6 h-6 text-emerald-200" />
          </div>
          <div>
            <div className="text-base font-bold tracking-tight">Institutional Privacy Charter: Events Only. No Scores. No Labels.</div>
            <p className="text-xs text-emerald-100/90 mt-1 leading-relaxed max-w-2xl">
              ClassSphere captures observable physical event counts only. We strictly refrain from producing behavioural grades, personality ratings, or automated disciplinary conclusions.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-mono px-3 py-1.5 rounded-xl bg-white/10 text-emerald-100 border border-white/20 font-semibold self-start sm:self-auto">
          Section A • Spring 2026
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50/60 to-emerald-50/20">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Student Telemetry Summary</h3>
            <p className="text-xs text-textSecondary mt-0.5">Aggregated counts across active session cameras</p>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or roll number..."
              className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/10"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8">
            <LoadingState label="Loading individual student telemetry records..." />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={Users}
              title="No student activity records found"
              description="No observable telemetry matches your current search query."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Phone Handling Events</th>
                  <th className="py-3 px-4">Talking Estimates</th>
                  <th className="py-3 px-4">Total Telemetry</th>
                  <th className="py-3 px-4">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-textPrimary">
                {filtered.map((s) => (
                  <tr key={s.student_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-textPrimary">{s.student_name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">{s.roll_number}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                        <span>{s.phone_event_count}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{s.talking_event_count}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-950 font-mono">{s.total_recorded_events}</td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={s.review_status} />
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
