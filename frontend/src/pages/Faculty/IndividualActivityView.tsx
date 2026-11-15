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

      {/* Privacy Pledge Banner */}
      <div className="bg-navy text-white p-5 rounded-xl border border-navy-light shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal flex items-center justify-center text-white flex-shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight">Privacy Statement: Events Only. No Scores. No Labels.</div>
            <p className="text-xs text-mutedBlue-dark mt-0.5">
              ClassSphere provides observable event counts only. We do not produce behavioural grades, personality ratings, or disciplinary conclusions.
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-3 py-1 rounded bg-white/10 text-teal-light border border-white/10">
          Section A • Spring 2026
        </span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-mutedBlue card-elevation overflow-hidden">
        <div className="p-5 border-b border-mutedBlue flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
              className="w-full px-3 py-2 text-xs border border-mutedBlue rounded-lg bg-surface outline-none focus:border-teal"
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
              <thead className="bg-surface text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-mutedBlue">
                <tr>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Phone Handling Events</th>
                  <th className="py-3 px-4">Talking Estimates</th>
                  <th className="py-3 px-4">Total Telemetry</th>
                  <th className="py-3 px-4">Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mutedBlue text-textPrimary">
                {filtered.map((s) => (
                  <tr key={s.student_id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-textPrimary">{s.student_name}</td>
                    <td className="py-3 px-4 font-mono text-textSecondary">{s.roll_number}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-textPrimary">
                        <Smartphone className="w-3.5 h-3.5 text-brandWarning" />
                        <span>{s.phone_event_count}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1.5 font-bold text-textPrimary">
                        <MessageSquare className="w-3.5 h-3.5 text-teal" />
                        <span>{s.talking_event_count}</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-navy">{s.total_recorded_events}</td>
                    <td className="py-3 px-4">
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
