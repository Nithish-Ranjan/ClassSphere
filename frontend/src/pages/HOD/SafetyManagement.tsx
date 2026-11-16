import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileCheck,
  Send,
  Info,
  Shield,
  Filter,
  Check,
  XCircle,
  Eye,
  Camera,
  User,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { incidentApi } from '../../services/api';
import { IncidentRecordItem } from '../../types';

export const SafetyManagementView: React.FC = () => {
  const [incidents, setIncidents] = useState<IncidentRecordItem[]>([]);
  const [historyIncidents, setHistoryIncidents] = useState<IncidentRecordItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecordItem | null>(null);
  const [decisionText, setDecisionText] = useState('');
  const [decisionStatus, setDecisionStatus] = useState<'RESOLVED_HOD' | 'DISMISSED_HOD'>('RESOLVED_HOD');
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const loadIncidents = () => {
    Promise.all([incidentApi.getActiveIncidents(), incidentApi.getIncidentHistory()]).then(
      ([active, history]) => {
        setIncidents(active);
        setHistoryIncidents(history);
        setLoading(false);
      }
    ).catch(() => setLoading(false));
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident || !decisionText.trim()) return;

    try {
      await incidentApi.resolveHOD(selectedIncident.id, decisionText.trim(), decisionStatus);
      setActionMessage(`Executive determination officially recorded for Incident #${selectedIncident.id}.`);
      setSelectedIncident(null);
      setDecisionText('');
      loadIncidents();
    } catch {
      alert('Failed to record HOD decision.');
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="Safety & Incident Response" pageSubtitle="Executive HOD triage, on-call alert routing, and formal determinations">
        <LoadingState label="Loading escalated safety incidents for executive review..." />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Incident Response & Escalations" pageSubtitle="IncidentRelay on-call triage: review and escalation first, administrative audit second">
      {/* Top Incident Priority Header (IncidentRelay style with Executive Plum) */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 shadow-md ${
        incidents.length > 0
          ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-500'
          : 'bg-gradient-to-r from-[#2E0854] to-purple-900 text-white border-purple-800'
      }`}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
            incidents.length > 0 ? 'bg-white/20 text-white' : 'bg-white/15 text-purple-200'
          }`}>
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full ${
                incidents.length > 0 ? 'bg-white text-red-700' : 'bg-white/20 text-purple-100'
              }`}>
                {incidents.length > 0 ? 'P1 CRITICAL TRIAGE ACTIVE' : 'INCIDENT QUEUE CLEAR'}
              </span>
              <span className="text-xs opacity-90 font-mono">CSE Department</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight mt-1 text-white">
              {incidents.length > 0
                ? `${incidents.length} Incident(s) Awaiting Executive Determination`
                : 'All Classrooms Normal — No Active Escalations'}
            </h2>
          </div>
        </div>

        {incidents.length > 0 && (
          <span className="text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-white text-red-700 font-mono shadow-xs self-start md:self-auto">
            Direct Action Required
          </span>
        )}
      </div>

      {/* Regulatory Limitation Banner */}
      <div className="bg-amber-50 border border-amber-200 text-brandWarning p-4 rounded-xl flex items-start gap-3 text-xs leading-relaxed mb-6">
        <Info className="w-5 h-5 flex-shrink-0 text-brandWarning mt-0.5" />
        <div>
          <span className="font-bold">Executive Incident Governance Protocol:</span> Computer vision safety models provide advisory detection only. System predictions must never be treated as automated medical diagnoses. The Head of Department records formal institutional determinations following physical verification by faculty or health personnel.
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-brandSuccess text-xs rounded-xl flex items-center gap-2 font-medium mb-6">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* SECTION 1: REVIEW AND ESCALATION FIRST (Dominant top section) */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-brandDanger" />
            <span>Active Escalation Queue ({incidents.length})</span>
          </h3>
          <span className="text-[11px] text-textSecondary font-mono">Priority Order: Severity</span>
        </div>

        {incidents.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Active Escalation Queue Empty"
            description="No classroom incidents currently require executive determination from the Head of Department."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="bg-white rounded-2xl border-2 border-red-200 p-6 shadow-sm space-y-4 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brandDanger text-white">
                        {inc.incident_type}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">INCIDENT #{inc.id}</span>
                    </div>
                    <h4 className="text-base font-bold text-textPrimary">
                      Room {inc.room_number} • {inc.subject_name}
                    </h4>
                    <div className="text-xs text-textSecondary flex items-center gap-2 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(inc.timestamp).toLocaleTimeString()} ({new Date(inc.timestamp).toLocaleDateString()})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-textSecondary block">Model Conf</span>
                    <span className="text-base font-mono font-bold text-brandDanger">
                      {(inc.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Faculty Observation Dossier */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-purple-950">
                    <User className="w-3.5 h-3.5 text-purple-700" />
                    <span>Faculty Escalation Dossier:</span>
                  </div>
                  <p className="text-slate-700 italic">
                    {inc.faculty_notes || 'Incident observed in classroom and escalated for formal HOD decision.'}
                  </p>
                </div>

                {/* Visual Snapshot Telemetry */}
                <div className="bg-slate-900 rounded-xl p-3 text-xs text-white/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-purple-300" />
                    <span>Visual Evidence Snapshot</span>
                  </div>
                  <span className="font-mono text-[10px] text-amber-300 font-semibold">
                    {inc.is_simulated ? '[SIMULATED DEMO EVENT]' : '[VERIFIED CAMERA FEED]'}
                  </span>
                </div>

                {/* Immediate Action Button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncident(inc);
                      setDecisionText('Reviewed incident telemetry. Verified physical safety and dispatched health center staff.');
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                  >
                    <FileCheck className="w-4 h-4 text-purple-200" />
                    <span>Record Executive Determination</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ADMINISTRATIVE SUMMARIES SECOND (Historical audit table) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50/60 to-purple-50/20">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Administrative Incident History & Audit Trail</h3>
            <p className="text-xs text-textSecondary mt-0.5">Full audit trail of previous classroom incidents and executive decisions</p>
          </div>
          <span className="text-xs font-mono text-purple-900 bg-purple-50 px-3 py-1 rounded-lg border border-purple-200 font-semibold">
            {historyIncidents.length} Resolved Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Classroom</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Faculty Inspection</th>
                <th className="py-3 px-4">HOD Executive Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-textPrimary">
              {historyIncidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-textSecondary">
                    No historical incident records in system audit logs.
                  </td>
                </tr>
              ) : (
                historyIncidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{inc.incident_type}</td>
                    <td className="py-3.5 px-4 font-semibold font-mono">{inc.room_number}</td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary text-[11px]">
                      {new Date(inc.timestamp).toLocaleDateString()} {new Date(inc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={inc.status} />
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary italic">{inc.faculty_notes || '—'}</td>
                    <td className="py-3.5 px-4 text-textPrimary font-medium">{inc.hod_decision || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Executive Decision Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 border border-slate-200 space-y-4">
            <div>
              <span className="text-[10px] font-mono font-bold uppercase text-brandDanger bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                Official Determination
              </span>
              <h3 className="font-bold text-textPrimary text-base mt-2">
                Record Executive Decision: Incident #{selectedIncident.id}
              </h3>
              <p className="text-xs text-textSecondary">
                Room {selectedIncident.room_number} • {selectedIncident.incident_type} • Confidence {(selectedIncident.confidence * 100).toFixed(0)}%
              </p>
            </div>

            <form onSubmit={handleResolve} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Administrative Disposition Status *
                </label>
                <select
                  value={decisionStatus}
                  onChange={(e: any) => setDecisionStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-slate-50 text-textPrimary outline-none focus:border-purple-700 font-semibold"
                >
                  <option value="RESOLVED_HOD">RESOLVED_HOD (Action Taken / Verified Safe by Health Staff)</option>
                  <option value="DISMISSED_HOD">DISMISSED_HOD (Confirmed False Positive Anomaly)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1.5">
                  Official Administrative Determination Record *
                </label>
                <textarea
                  value={decisionText}
                  onChange={(e) => setDecisionText(e.target.value)}
                  placeholder="Record formal administrative findings, healthcare notifications, and actions taken..."
                  required
                  rows={4}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl bg-white outline-none focus:border-purple-700 text-textPrimary"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                Confirming this action permanently writes to the immutable audit trail and broadcasts status updates to all portal listeners.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-900 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
                >
                  Lock Determination in Audit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};
