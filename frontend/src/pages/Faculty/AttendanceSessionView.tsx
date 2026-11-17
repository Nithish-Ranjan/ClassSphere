import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RefreshCw,
  Camera,
  FileCheck,
  AlertTriangle,
  Radio,
  Layers,
  UserX,
  UserPlus,
  Sparkles,
  SlidersHorizontal,
  Image as ImageIcon,
  Check,
  X,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { attendanceApi } from '../../services/api';
import { AttendanceSessionData, AttendanceRecordItem } from '../../types';
import { LoadingState, ErrorState, TabsNav, StatusBadge } from '../../components/ui';
import { useWebSocket } from '../../hooks/useWebSocket';

export const AttendanceSessionView: React.FC = () => {
  const [sessionData, setSessionData] = useState<AttendanceSessionData | null>(null);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecordItem | null>(null);
  const [overrideStatus, setOverrideStatus] = useState('PRESENT');
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [candidateFilter, setCandidateFilter] = useState<'ALL' | 'UNCERTAIN' | 'MATCHED' | 'DUPLICATE'>('ALL');

  const sessionId = 2; // Active demo session

  const attendanceFacultyTabs = [
    { name: 'Active Session & Verification', to: '/faculty/attendance/session', icon: UserCheck },
    { name: 'Image Verification Queue', to: '/faculty/attendance/verification', icon: Camera },
  ];

  const loadSession = useCallback(() => {
    attendanceApi
      .getSession(sessionId)
      .then((data) => {
        setSessionData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load active attendance session.');
        setLoading(false);
      });
  }, [sessionId]);

  const handleWsEvent = useCallback((event: string, data: any) => {
    if (event === 'STUDENT_CHECKIN') {
      setActionMessage(`Live check-in received: ${data.name} (${data.roll_number})`);
      loadSession();
    } else if (event === 'PHOTO_PROCESSED' || event === 'ATTENDANCE_FINALIZED') {
      setActionMessage(`Real-time update: ${event.replace(/_/g, ' ')}`);
      loadSession();
    }
  }, [loadSession]);

  const { isConnected: isWsConnected } = useWebSocket({
    classSessionId: sessionData?.class_session_id || 1,
    onEvent: handleWsEvent,
  });

  useEffect(() => {
    loadSession();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setActionMessage(null);
    try {
      const res = await attendanceApi.uploadPhoto(sessionId, file);
      setPipelineResult(res);
      setActionMessage(
        `Multi-face verification complete. Detected ${res.total_faces_detected} faces, matched ${res.matched_candidates_count} candidates, ${res.uncertain_candidates_count} uncertain queued for review.`
      );
      loadSession();
    } catch (err: any) {
      setActionMessage('Failed to process image. Please check camera resolution.');
    } finally {
      setUploading(false);
    }
  };

  const handleQuickReview = async (recordId: number, decision: string) => {
    try {
      await attendanceApi.reviewCandidate(recordId, decision);
      setActionMessage(`Candidate decision recorded: ${decision.replace(/_/g, ' ')}`);
      loadSession();
      if (pipelineResult?.candidate_matches) {
        setPipelineResult({
          ...pipelineResult,
          candidate_matches: pipelineResult.candidate_matches.map((c: any) =>
            c.record_id === recordId ? { ...c, status: 'CONFIRMED_BY_REVIEWER' } : c
          ),
        });
      }
    } catch {
      alert('Failed to update candidate record');
    }
  };

  const handleOverrideSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord || !overrideReason.trim()) return;

    try {
      await attendanceApi.overrideRecord(selectedRecord.id, overrideStatus, overrideReason.trim());
      setShowOverrideModal(false);
      setSelectedRecord(null);
      setOverrideReason('');
      setActionMessage('Attendance override recorded with required audit trail.');
      loadSession();
    } catch (err: any) {
      alert('Failed to override record');
    }
  };

  const handleFinalize = async () => {
    if (
      !confirm(
        'Are you sure you want to finalize and lock attendance? Unresolved pending records will be finalized as ABSENT.'
      )
    ) {
      return;
    }

    try {
      await attendanceApi.finalizeSession(sessionId);
      setActionMessage('Attendance finalized and locked to PostgreSQL database.');
      loadSession();
    } catch {
      alert('Failed to finalize session.');
    }
  };

  if (loading) {
    return (
      <AppShell pageTitle="Attendance Verification" pageSubtitle="Multi-modal face recognition and review queue">
        <TabsNav tabs={attendanceFacultyTabs} className="mb-6" />
        <LoadingState label="Loading attendance verification session and student roster..." />
      </AppShell>
    );
  }

  if (error || !sessionData) {
    return (
      <AppShell pageTitle="Attendance Verification" pageSubtitle="Multi-modal face recognition and review queue">
        <TabsNav tabs={attendanceFacultyTabs} className="mb-6" />
        <ErrorState message={error || 'Unable to load attendance session'} onRetry={loadSession} />
      </AppShell>
    );
  }

  const isFinalized = sessionData.status === 'FINALIZED';

  return (
    <AppShell pageTitle="Attendance Management" pageSubtitle="Multi-modal identity verification, review queue, and finalization">
      {/* Contextual Tabs */}
      <TabsNav tabs={attendanceFacultyTabs} className="mb-6" />

      {/* Session Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-md bg-emerald-900 text-white">
              SESSION #{sessionData.id}
            </span>
            <StatusBadge status={sessionData.status} />
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              isWsConnected ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-600 animate-pulse' : 'bg-slate-400'}`} />
              <span>{isWsConnected ? 'LIVE WS SYNC' : 'OFFLINE'}</span>
            </span>
          </div>
          <h2 className="text-xl font-bold text-textPrimary tracking-tight">
            Challenge Code: <span className="font-mono text-emerald-700 font-extrabold">{sessionData.verification_challenge}</span>
          </h2>
          <p className="text-xs text-textSecondary mt-0.5">
            Students scan QR or enter code to check in. Then capture or upload classroom photo below.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {!isFinalized && (
            <label className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm">
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Processing CV Model...' : 'Upload Classroom Photo'}</span>
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
            </label>
          )}

          {!isFinalized && (
            <button
              onClick={handleFinalize}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <span>Finalize & Persist</span>
            </button>
          )}
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium mt-4">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Review Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Total Candidates</span>
          <div className="text-2xl font-bold text-textPrimary mt-1 font-mono">{sessionData.records?.length || 0}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">High Match Verified</span>
          <div className="text-2xl font-bold text-brandSuccess mt-1 font-mono">{sessionData.verified_matches_count || 0}</div>
          <span className="text-[10px] text-textSecondary font-mono">Confidence ≥ 0.82</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Pending Review Queue</span>
          <div className="text-2xl font-bold text-amber-700 mt-1 font-mono">{sessionData.pending_reviews_count || 0}</div>
          <span className="text-[10px] text-textSecondary font-mono">Uncertain (0.50 ≤ conf &lt; 0.82)</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm">
          <span className="text-xs text-textSecondary uppercase tracking-wider font-semibold">Verification Pipeline</span>
          <div className="text-xs font-mono font-bold text-emerald-950 mt-2">FaceNet ArcFace + YOLO</div>
          <span className="text-[10px] text-textSecondary">Held-out reference matching</span>
        </div>
      </div>

      {/* =========================================================================
          MULTI-FACE CANDIDATE MATCHING & REVIEW INTERFACE
         ========================================================================= */}
      {pipelineResult && (
        <div className="bg-white rounded-2xl border border-emerald-300 card-elevation overflow-hidden mt-6 animate-fadeIn">
          <div className="p-5 sm:p-6 border-b border-emerald-100 bg-gradient-to-r from-emerald-50/70 via-teal-50/40 to-white flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-700 text-white">
                  MULTI-FACE MATCHING INTERFACE
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-white text-emerald-900 border border-emerald-200">
                  Model: {pipelineResult.model_version}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  Image Quality: {Math.round(pipelineResult.image_quality?.quality_score * 100)}%
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Detected Face Candidates & One-to-One Disambiguation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluates cosine feature distance against registered student biometric references. Duplicate candidates and ambiguous matches are flagged for manual review.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-3.5 py-2 bg-white hover:bg-slate-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs">
                <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
                <span>Repeat Test Run with Another Photo</span>
                <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500 font-semibold text-[11px] mr-1">Filter Candidates:</span>
            {[
              { id: 'ALL', label: `All Candidates (${pipelineResult.candidate_matches?.length || 0})` },
              { id: 'UNCERTAIN', label: `Uncertain Review Queue (${pipelineResult.uncertain_candidates_count || 0})` },
              { id: 'MATCHED', label: `High Match (${pipelineResult.matched_candidates_count || 0})` },
              { id: 'DUPLICATE', label: `Duplicate Candidates (${pipelineResult.duplicate_candidates_count || 0})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCandidateFilter(tab.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  candidateFilter === tab.id
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Candidate Match Grid */}
          <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pipelineResult.candidate_matches
              ?.filter((c: any) => {
                if (candidateFilter === 'UNCERTAIN') return c.status === 'UNCERTAIN';
                if (candidateFilter === 'MATCHED') return c.status === 'MATCHED_CANDIDATE';
                if (candidateFilter === 'DUPLICATE') return c.status === 'DUPLICATE_CANDIDATE';
                return true;
              })
              .map((c: any) => {
                const isMatched = c.status === 'MATCHED_CANDIDATE';
                const isUncertain = c.status === 'UNCERTAIN';
                const isDuplicate = c.status === 'DUPLICATE_CANDIDATE';
                const isConfirmed = c.status === 'CONFIRMED_BY_REVIEWER';

                return (
                  <div
                    key={c.face_index}
                    className={`rounded-2xl border p-4 transition-all space-y-3.5 ${
                      isDuplicate
                        ? 'border-purple-300 bg-purple-50/30'
                        : isUncertain
                        ? 'border-amber-300 bg-amber-50/20'
                        : isMatched
                        ? 'border-emerald-200 bg-white hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50/40'
                    }`}
                  >
                    {/* Face crop / detection box header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 font-mono font-bold text-xs flex items-center justify-center border border-slate-700 shadow-inner">
                          #{c.face_index}
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 block">
                            Box: [{c.bounding_box.width}x{c.bounding_box.height}]
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                            Quality: {Math.round(c.face_quality_score * 100)}%
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md font-mono ${
                          isMatched
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isUncertain
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : isDuplicate
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : isConfirmed
                            ? 'bg-teal-100 text-teal-900 border border-teal-300'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Student Candidate Identification */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                      <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 block">
                        Assigned Student Reference
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 tracking-tight">
                        {c.student_name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono">Roll: {c.roll_number}</p>
                    </div>

                    {/* Model Cosine Similarity Score */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-semibold text-slate-600">Model Cosine Similarity</span>
                        <span className="font-mono font-bold text-slate-900">
                          {c.similarity_score ? (c.similarity_score * 100).toFixed(1) : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isMatched
                              ? 'bg-emerald-500'
                              : isUncertain
                              ? 'bg-amber-500'
                              : isDuplicate
                              ? 'bg-purple-500'
                              : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, (c.similarity_score || 0) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 italic">
                        Cosine feature distance; not an identity probability.
                      </p>
                    </div>

                    {/* Review Controls */}
                    {!isFinalized && c.record_id && (
                      <div className="pt-1 flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQuickReview(c.record_id, 'CONFIRM_PRESENT')}
                          className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirm</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickReview(c.record_id, 'MARK_LATE')}
                          className="py-1.5 px-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors cursor-pointer"
                          title="Mark Late"
                        >
                          Late
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickReview(c.record_id, 'REJECT_ABSENT')}
                          className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[11px] transition-colors cursor-pointer"
                          title="Reject / Absent"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Roster & Verification Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden mt-6">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-textPrimary text-base">Classroom Verification Roster</h3>
            <p className="text-xs text-textSecondary mt-0.5">
              Review candidates, examine model confidence scores, and resolve exceptions before locking.
            </p>
          </div>
          <button
            onClick={loadSession}
            className="p-2 text-textSecondary hover:text-textPrimary rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            title="Refresh records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student Identity</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4">Verification Source</th>
                <th className="py-3 px-4">Biometric Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Audit Trail / Override</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-textPrimary">
              {sessionData.records?.map((r) => {
                const confPct = r.confidence_score !== null && r.confidence_score !== undefined
                  ? Math.round(r.confidence_score * 100)
                  : null;
                const isHighMatch = confPct !== null && confPct >= 82;
                const isUncertain = confPct !== null && confPct >= 50 && confPct < 82;

                return (
                  <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-emerald-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {r.student_name.slice(0, 1)}
                        </div>
                        <div>
                          <span className="font-semibold text-textPrimary block">{r.student_name}</span>
                          <span className="text-[10px] text-textSecondary font-mono">ID: STU-{r.student_id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-textSecondary">{r.roll_number}</td>
                    <td className="py-3.5 px-4">
                      {r.manual_override ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <span>Faculty Manual Override</span>
                        </span>
                      ) : r.verified_by_photo ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>CCTV Face Match</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                          <span>PIN Challenge Check-in</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {confPct !== null ? (
                        <div className="w-32 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className={isHighMatch ? 'text-emerald-700 font-bold' : isUncertain ? 'text-amber-700 font-bold' : 'text-slate-500'}>
                              {confPct}%
                            </span>
                            <span className="text-[10px] text-textSecondary">
                              {isHighMatch ? 'HIGH MATCH' : isUncertain ? 'REVIEW' : 'LOW'}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                isHighMatch ? 'bg-emerald-500' : isUncertain ? 'bg-amber-500' : 'bg-slate-400'
                              }`}
                              style={{ width: `${confPct}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-textSecondary text-[11px] italic">No visual match</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-textSecondary text-[11px]">
                      {r.manual_override ? (
                        <span className="text-slate-800 font-medium block" title={r.override_reason}>
                          Reason: {r.override_reason}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-[10px]">Verified Automated</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!isFinalized && (
                        <button
                          onClick={() => {
                            setSelectedRecord(r);
                            setOverrideStatus(r.status === 'PRESENT' ? 'ABSENT' : 'PRESENT');
                            setShowOverrideModal(true);
                          }}
                          className="px-3 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                        >
                          Audit Correct
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Override Modal */}
      {showOverrideModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <h3 className="font-bold text-textPrimary text-base mb-1">
              Manual Attendance Correction: {selectedRecord.student_name}
            </h3>
            <p className="text-xs text-textSecondary mb-4">
              All manual overrides are cryptographically logged with user identity and timestamp.
            </p>

            <form onSubmit={handleOverrideSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">New Attendance Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-600 font-medium"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="LATE">LATE</option>
                  <option value="ABSENT">ABSENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-textSecondary mb-1">
                  Reason for Override <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Student was present in back row; camera angle occluded face."
                  required
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl outline-none focus:border-emerald-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOverrideModal(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                >
                  Save Override with Audit Trail
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
};
