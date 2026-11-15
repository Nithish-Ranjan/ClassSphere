import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { studentApi, attendanceApi } from '../../services/api';
import { ClassCompanionData } from '../../types';
import { LoadingState, ErrorState, TabsNav, StatusBadge } from '../../components/ui';
import { useWebSocket } from '../../hooks/useWebSocket';

export const ClassCompanion: React.FC = () => {
  const [companion, setCompanion] = useState<ClassCompanionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState('');
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

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
      .catch((err) => {
        setError('Failed to load active class telemetry.');
        setLoading(false);
      });
  }, []);

  const handleWsEvent = useCallback((event: string) => {
    if (event === 'ATTENDANCE_SESSION_STARTED' || event === 'PHOTO_PROCESSED' || event === 'ATTENDANCE_FINALIZED') {
      loadCompanionData();
    }
  }, [loadCompanionData]);

  const { isConnected: isWsConnected } = useWebSocket({
    onEvent: handleWsEvent,
  });

  useEffect(() => {
    loadCompanionData();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeInput.trim()) return;

    setCheckInStatus('submitting');
    try {
      const res = await attendanceApi.checkIn(challengeInput.trim().toUpperCase());
      setCheckInStatus('success');
      setStatusMessage(
        res.message || 'Check-in recorded. Awaiting classroom camera/photo identity verification.'
      );
      loadCompanionData();
    } catch (err: any) {
      setCheckInStatus('error');
      setStatusMessage(
        err.response?.data?.detail || 'Failed to check in. Check your challenge code and retry.'
      );
    }
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
      <div className="bg-white rounded-xl border border-slate-200 p-6 card-elevation space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-[#10233F] text-white">
                {companion?.subject_code || 'CS301'}
              </span>
              <StatusBadge status={companion?.session_status || 'SCHEDULED'} />
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                MODE: {companion?.mode || 'SIMULATION'}
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                isWsConnected ? 'bg-teal/10 text-teal border border-teal/30' : 'bg-slate-100 text-slate-500 border border-slate-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isWsConnected ? 'bg-teal animate-pulse' : 'bg-slate-400'}`} />
                <span>{isWsConnected ? 'LIVE FEED' : 'OFFLINE'}</span>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-textPrimary tracking-tight">
              {companion?.subject_name || 'Deep Learning & Computer Vision'}
            </h2>
            <p className="text-xs text-textSecondary mt-1">Topic: {companion?.topic || 'Standard Curriculum Session'}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-left md:text-right">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-textSecondary block">
                Verification State
              </span>
              <div className="mt-1">
                <StatusBadge status={companion?.my_attendance_status || 'NOT_TAKEN'} size="md" />
              </div>
            </div>
          </div>
        </div>

        {/* Operational Context Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">Room Location</span>
            <span className="text-sm font-bold text-textPrimary mt-1 block">{companion?.room_number || 'Hall A-101'}</span>
            <span className="text-[11px] text-textSecondary">Physical Classroom</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">Scheduled Time</span>
            <span className="text-sm font-bold text-textPrimary mt-1 block">{companion?.scheduled_time || '09:30 AM - 10:30 AM'}</span>
            <span className="text-[11px] text-textSecondary">Official Curricular Period</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-textSecondary block">Camera Monitoring</span>
            <span className="text-sm font-bold text-teal mt-1 block">Telemetry Active</span>
            <span className="text-[11px] text-textSecondary">Stream Ingestion Pipeline</span>
          </div>
        </div>

        {/* Verification Check-In Card */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-textPrimary tracking-tight">Active Attendance Session Check-In</h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                Enter the active 6-character challenge code announced or projected on the classroom board by the faculty.
                <br />
                <span className="text-slate-500 font-medium">
                  Note: A check-in code registers a validated candidate attempt. Official attendance is confirmed when the faculty processes classroom image verification.
                </span>
              </p>

              {/* Status Message Banner */}
              {statusMessage && (
                <div
                  className={`mt-4 p-3.5 rounded-lg text-xs flex items-start gap-2.5 ${
                    checkInStatus === 'success'
                      ? 'bg-emerald-50 text-brandSuccess border border-emerald-200 font-semibold'
                      : 'bg-red-50 text-brandDanger border border-red-200'
                  }`}
                >
                  {checkInStatus === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <div>{statusMessage}</div>
                </div>
              )}

              {/* Form Input */}
              <form onSubmit={handleCheckIn} className="mt-4 flex flex-col sm:flex-row gap-3 max-w-lg">
                <input
                  type="text"
                  value={challengeInput}
                  onChange={(e) => setChallengeInput(e.target.value.toUpperCase())}
                  placeholder="Enter 6-char PIN (e.g. CS94A2)"
                  maxLength={8}
                  className="px-4 py-2.5 text-sm tracking-wider font-mono font-bold uppercase rounded-lg border border-slate-300 bg-white outline-none focus:border-teal focus:ring-2 focus:ring-teal/20"
                />
                <button
                  type="submit"
                  disabled={checkInStatus === 'submitting' || !challengeInput.trim()}
                  className="px-5 py-2.5 rounded-lg bg-[#10233F] hover:bg-[#183B5B] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-subtle"
                >
                  {checkInStatus === 'submitting' ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Record Check-In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
