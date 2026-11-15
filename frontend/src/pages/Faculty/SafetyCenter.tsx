import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Clock,
  Eye,
  Send,
  Info,
  Shield,
  FileText,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { LoadingState } from '../../components/ui/LoadingState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { incidentApi } from '../../services/api';
import { IncidentRecordItem } from '../../types';

export const SafetyCenter: React.FC = () => {
  const [activeIncidents, setActiveIncidents] = useState<IncidentRecordItem[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<IncidentRecordItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal actions
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecordItem | null>(null);
  const [actionType, setActionType] = useState<'acknowledge' | 'dismiss' | 'escalate' | null>(null);
  const [actionNotes, setActionNotes] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadIncidents = () => {
    Promise.all([incidentApi.getActiveIncidents(), incidentApi.getIncidentHistory()]).then(
      ([active, history]) => {
        setActiveIncidents(active);
        setHistoryIncidents(history);
        setLoading(false);
      }
    ).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !actionType) return;

    try {
      if (actionType === 'acknowledge') {
        await incidentApi.acknowledge(selectedIncident.id, actionNotes);
        setActionMessage('Incident confirmed and acknowledged in classroom.');
      } else if (actionType === 'dismiss') {
        await incidentApi.dismiss(selectedIncident.id, actionNotes || 'Dismissed by faculty inspection');
        setActionMessage('Incident dismissed as false positive.');
      } else if (actionType === 'escalate') {
        await incidentApi.escalate(selectedIncident.id, actionNotes);
        setActionMessage('Incident escalated to HOD for executive review.');
      }

      setSelectedIncident(null);
      setActionType(null);
      setActionNotes('');
      loadIncidents();
    } catch {
      alert('Failed to submit incident action.');
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="Safety Centre" pageSubtitle="Classroom incident monitoring and human verification">
        <LoadingState label="Loading classroom safety incidents and verification states..." />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Safety Centre" pageSubtitle="Detection → Verify → Acknowledge / Escalate emergency incident workflow">
      {/* Regulatory Limitation Banner (PRD FR-13) */}
      <div className="bg-amber-50 border border-amber-200 text-brandWarning p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed">
        <Info className="w-5 h-5 flex-shrink-0 text-brandWarning mt-0.5" />
        <div>
          <span className="font-bold">Human Verification Protocol:</span> Computer vision fall and anomaly models provide
          advisory detection only. System predictions must never be treated as automated medical diagnoses. Faculty or staff
          must inspect the scene and record an explicit acknowledgment or escalation.
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-brandSuccess text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Active Incidents Requiring Review */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-textPrimary uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-brandDanger" />
            <span>Active Incidents Awaiting Faculty Review ({activeIncidents.length})</span>
          </h2>
        </div>

        {activeIncidents.length === 0 ? (
          <div className="bg-white p-8 rounded-xl border border-mutedBlue text-center text-xs text-textSecondary card-elevation">
            No unresolved safety incidents. All classrooms reporting clear status.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeIncidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white p-5 rounded-xl border-2 border-red-200 bg-red-50/20 card-elevation space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-brandDanger text-white">
                      {inc.incident_type.replace('_', ' ')}
                    </span>
                    <h3 className="text-base font-bold text-textPrimary mt-1.5">
                      Room {inc.room_number} • {inc.subject_name}
                    </h3>
                    <div className="text-xs text-textSecondary flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(inc.timestamp).toLocaleTimeString()} ({new Date(inc.timestamp).toLocaleDateString()})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-semibold text-textSecondary block">Confidence</span>
                    <span className="text-sm font-bold text-brandDanger font-mono">
                      {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Evidence snapshot placeholder */}
                <div className="bg-navy rounded-lg p-3 text-xs text-white/80 flex items-center justify-between">
                  <span>Visual Evidence Snapshot Recorded</span>
                  <span className="font-mono text-[10px] text-amber-300">
                    {inc.is_simulated ? '[SIMULATED INCIDENT DATA]' : '[VERIFIED CAMERA FEED]'}
                  </span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-mutedBlue">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType('acknowledge');
                      setActionNotes('Verified in classroom; student safe and confirmed.');
                    }}
                    className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 text-brandSuccess border border-emerald-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType('dismiss');
                      setActionNotes('False positive: Student bent down to pick up bag.');
                    }}
                    className="py-2 px-2 bg-surface hover:bg-mutedBlue text-textSecondary rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors border border-mutedBlue cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setActionType('escalate');
                      setActionNotes('Medical or administrative assistance required. Escalating to HOD.');
                    }}
                    className="py-2 px-2 bg-navy hover:bg-darkBlue text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Escalate to HOD</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident History Log */}
      <div className="bg-white rounded-xl border border-mutedBlue card-elevation overflow-hidden mt-6">
        <div className="p-5 border-b border-mutedBlue flex items-center justify-between">
          <h3 className="font-bold text-textPrimary text-base">Past Incident Auditing History</h3>
          <span className="text-xs font-mono text-textSecondary bg-surface px-2.5 py-1 rounded border border-mutedBlue">
            {historyIncidents.length} Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface text-textSecondary font-semibold uppercase tracking-wider text-[10px] border-b border-mutedBlue">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Room</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Faculty Resolution Notes</th>
                <th className="py-3 px-4">HOD Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-mutedBlue text-textPrimary">
              {historyIncidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-navy">{inc.incident_type}</td>
                  <td className="py-3 px-4">{inc.room_number}</td>
                  <td className="py-3 px-4 font-mono text-textSecondary">
                    {new Date(inc.timestamp).toLocaleDateString()} {new Date(inc.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={inc.status} />
                  </td>
                  <td className="py-3 px-4 text-textSecondary italic">{inc.faculty_notes || '—'}</td>
                  <td className="py-3 px-4 text-textSecondary italic">{inc.hod_decision || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {selectedIncident && actionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-mutedBlue">
            <h3 className="font-bold text-textPrimary text-base mb-1 capitalize">
              {actionType} Safety Incident #{selectedIncident.id}
            </h3>
            <p className="text-xs text-textSecondary mb-4">
              Room {selectedIncident.room_number} • {selectedIncident.incident_type}
            </p>

            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">
                  Required Resolution Note *
                </label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="Enter observation notes for official audit log..."
                  required
                  rows={3}
                  className="w-full px-3 py-2 text-xs border border-mutedBlue rounded-lg bg-surface outline-none focus:border-teal"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-surface text-textSecondary hover:text-textPrimary rounded-lg text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-navy hover:bg-darkBlue text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Confirm Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};
