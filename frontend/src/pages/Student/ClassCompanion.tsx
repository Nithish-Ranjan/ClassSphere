import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Clock,
  MapPin,
  User,
  CheckCircle2,
  AlertCircle,
  QrCode,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Sparkles,
  LayoutDashboard,
  Radio,
  FileCheck2,
  Camera,
  Upload,
  RefreshCw,
  AlertTriangle,
  Check,
  Eye,
  Info,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi, attendanceApi } from '../../services/api';
import { ClassCompanionData } from '../../types';
import { LoadingState, ErrorState, TabsNav, StatusBadge, Button } from '../../components/ui';
import { useWebSocket } from '../../hooks/useWebSocket';

interface PhotoVerificationResult {
  status: string;
  similarity_score: number;
  similarity_metric: string;
  quality_score: number;
  is_matched: boolean;
  photo_url?: string;
  message: string;
}

export const ClassCompanion: React.FC = () => {
  const [companion, setCompanion] = useState<ClassCompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Selfie / Photo Verification states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoResult, setPhotoResult] = useState<PhotoVerificationResult | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const overviewTabs = [
    { name: 'Student Overview', to: '/student/dashboard', icon: LayoutDashboard },
    { name: 'Class Companion', to: '/student/companion', icon: Clock },
  ];

  const loadCompanionData = useCallback(() => {
    studentApi
      .getClassCompanion()
      .then((res) => {
        setCompanion(res);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load active class telemetry.');
        setLoading(false);
      });
  }, []);

  const handleWsEvent = useCallback((event: string) => {
    if (event === 'ATTENDANCE_SESSION_STARTED' || event === 'PHOTO_PROCESSED' || event === 'ATTENDANCE_FINALIZED' || event === 'STUDENT_PHOTO_SUBMITTED') {
      loadCompanionData();
    }
  }, [loadCompanionData]);

  const { isConnected: isWsConnected } = useWebSocket({
    onEvent: handleWsEvent,
  });

  useEffect(() => {
    loadCompanionData();
  }, [loadCompanionData]);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeInput.trim()) return;

    setCheckInStatus('submitting');
    try {
      const res = await attendanceApi.checkIn(challengeInput.trim().toUpperCase());
      setCheckInStatus('success');
      setStatusMessage(
        res.message || 'Check-in recorded. Awaiting classroom camera or selfie verification.'
      );
      loadCompanionData();
    } catch (err: any) {
      setCheckInStatus('error');
      setStatusMessage(
        err.response?.data?.detail || 'Failed to check in. Check your challenge code and retry.'
      );
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!companion?.attendance_session_id) {
      setPhotoError('Active attendance session ID not found. Ensure faculty has started attendance.');
      return;
    }

    setPhotoError(null);
    setUploadingPhoto(true);

    // Create local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const res = await attendanceApi.uploadStudentVerificationPhoto(companion.attendance_session_id, file);
      setPhotoResult(res);
      loadCompanionData();
    } catch (err: any) {
      setPhotoError(err.response?.data?.detail || 'Failed to upload verification photograph. Try again.');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <AppShell pageTitle="Class Companion" pageSubtitle="Real-time class telemetry, schedules, and attendance check-in">
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <LoadingState label="Connecting to classroom session telemetry..." />
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell pageTitle="Class Companion" pageSubtitle="Real-time class telemetry, schedules, and attendance check-in">
        <TabsNav tabs={overviewTabs} className="mb-6" />
        <ErrorState message={error} onRetry={loadCompanionData} />
      </AppShell>
    );
  }

  return (
    <AppShell pageTitle="Class Companion" pageSubtitle="Real-time class telemetry, schedules, and attendance check-in">
      {/* Contextual Tabs */}
      <TabsNav tabs={overviewTabs} className="mb-6" />

      {/* Main Active Session Banner */}
      <div className="bg-white rounded-2xl border border-[var(--role-border)] p-6 sm:p-8 card-elevation space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[var(--role-primary)] text-white">
                {companion?.subject_code || 'CS301'}
              </span>
              <StatusBadge status={companion?.session_status || 'SCHEDULED'} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-300">
                MODE: {companion?.mode || 'SIMULATION'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                isWsConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span>{isWsConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-[var(--role-text)] tracking-tight">
              {companion?.subject_name || 'Deep Learning & Computer Vision'}
            </h2>
            <p className="text-xs text-[var(--role-text-muted)] mt-1">Topic: {companion?.topic || 'Standard Curriculum Session'}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left md:text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--role-text-muted)] block">
                Official Verification State
              </span>
              <div className="mt-1 flex items-center gap-2 justify-end">
                <StatusBadge status={companion?.my_attendance_status || 'NOT_TAKEN'} size="md" />
                {companion?.confidence_score && (
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {Math.round(companion.confidence_score * 100)}% Sim
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--role-text-muted)] block">Room Location</span>
            <span className="text-sm font-bold text-[var(--role-text)] mt-1 block">{companion?.room_number || 'Hall A-101'}</span>
            <span className="text-[11px] text-[var(--role-text-muted)]">Physical Classroom</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--role-text-muted)] block">Scheduled Time</span>
            <span className="text-sm font-bold text-[var(--role-text)] mt-1 block">{companion?.scheduled_time || '09:30 AM - 10:30 AM'}</span>
            <span className="text-[11px] text-[var(--role-text-muted)]">Official Curricular Period</span>
          </div>

          <div className="p-4 rounded-xl bg-[var(--role-soft)] border border-[var(--role-soft-border)]">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--role-primary)] block">Camera Monitoring</span>
            <span className="text-sm font-bold text-[var(--role-primary)] mt-1 block">Telemetry Active</span>
            <span className="text-[11px] text-[var(--role-text-muted)]">Stream Ingestion Pipeline</span>
          </div>
        </div>

        {/* Verification Check-In & Biometric Capture Workflows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
          
          {/* Step 1: Active Code Check-In */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 to-indigo-50/40 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-[var(--role-primary)] text-white flex items-center justify-center shadow-sm shadow-blue-500/20">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">Step 1: Session Challenge PIN</h3>
                  <span className="text-[11px] text-slate-500">Fast classroom presence handshake</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Enter the active 6-character challenge PIN announced or displayed on the classroom projection screen by your instructor.
              </p>

              {statusMessage && (
                <div
                  className={`mb-4 p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                    checkInStatus === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold'
                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}
                >
                  {checkInStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  )}
                  <div>{statusMessage}</div>
                </div>
              )}
            </div>

            <form onSubmit={handleCheckIn} className="flex gap-2">
              <input
                type="text"
                value={challengeInput}
                onChange={(e) => setChallengeInput(e.target.value.toUpperCase())}
                placeholder="PIN (e.g. CS94A2)"
                maxLength={8}
                className="flex-1 px-4 py-2 text-sm tracking-wider font-mono font-bold uppercase rounded-lg border border-slate-300 bg-white outline-none focus:border-[var(--role-primary)] focus:ring-2 focus:ring-[var(--role-ring)]"
              />
              <Button
                type="submit"
                variant="primary"
                disabled={checkInStatus === 'submitting' || !challengeInput.trim()}
                isLoading={checkInStatus === 'submitting'}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Check In
              </Button>
            </form>
          </div>

          {/* Step 2: Student Selfie / Photo Verification Capture */}
          <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-purple-50/30 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-sm shadow-indigo-500/20">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 tracking-tight">Step 2: Face Verification Selfie</h3>
                    <span className="text-[11px] text-slate-500">Biometric candidate verification</span>
                  </div>
                </div>
                {companion?.attendance_session_id && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                    SESSION #{companion.attendance_session_id}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Capture or upload a clear, well-lit photo of yourself in class to confirm your identity against your reference vector embedding.
              </p>

              {/* Photo Error Banner */}
              {photoError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                  <span>{photoError}</span>
                </div>
              )}

              {/* Result State */}
              {photoResult && (
                <div className={`mb-4 p-3.5 rounded-xl border text-xs space-y-2 ${
                  photoResult.is_matched 
                    ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900' 
                    : 'bg-amber-50/90 border-amber-200 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      {photoResult.is_matched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      )}
                      <span>{photoResult.is_matched ? 'Identity Match Confirmed' : 'Queued for Manual Review'}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono font-bold bg-white/80 border text-[11px]">
                      {Math.round(photoResult.similarity_score * 100)}% Match
                    </span>
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-90">
                    {photoResult.message}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1 border-t border-black/5 text-[10px] font-mono">
                    <span className="bg-white/60 px-1.5 py-0.5 rounded">
                      Metric: {photoResult.similarity_metric}
                    </span>
                    <span className="bg-white/60 px-1.5 py-0.5 rounded">
                      Quality: {Math.round(photoResult.quality_score * 100)}%
                    </span>
                    <span className="bg-white/60 px-1.5 py-0.5 rounded font-bold">
                      Status: {photoResult.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Preview if uploaded */}
              {photoPreview && !photoResult && (
                <div className="mb-4 flex items-center gap-3 p-2 bg-white rounded-xl border border-slate-200">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                  />
                  <div className="text-xs">
                    <span className="font-bold text-slate-800 block">Uploading & Analyzing...</span>
                    <span className="text-[11px] text-slate-500">Checking face embeddings...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              capture="user"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="primary"
                onClick={triggerUpload}
                disabled={uploadingPhoto || !companion?.attendance_session_id}
                isLoading={uploadingPhoto}
                leftIcon={<Camera className="w-4 h-4" />}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {photoResult ? 'Re-submit Verification Photo' : 'Capture / Upload Photo'}
              </Button>
            </div>

            {!companion?.attendance_session_id && (
              <span className="text-[11px] text-amber-700 mt-2 block font-medium">
                * Available as soon as the faculty starts the active attendance session.
              </span>
            )}
          </div>
        </div>

        {/* Verification Methodology Notice */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 leading-relaxed">
            <span className="font-bold text-slate-800 block mb-0.5">Biometric Ethics & Matching Transparency</span>
            ClassSphere uses localized face embedding cosine comparison (<code className="font-mono text-slate-700">FaceEmbedNet-v2.1</code>). 
            Scores represent normalized vector distance from consented student reference vectors, not absolute probability. Uncertain matches (&lt;85% similarity) are never automatically rejected; they are routed directly to faculty manual review.
          </div>
        </div>
      </div>
    </AppShell>
  );
};
