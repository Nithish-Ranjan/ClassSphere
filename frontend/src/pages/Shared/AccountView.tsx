import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Smartphone,
  Lock,
  Mail,
  Building,
  Key,
  CheckCircle2,
  AlertCircle,
  FileCheck2,
  Calendar,
} from 'lucide-react';
import { AppShell } from '../../components/Layout/AppShell';
import { useAuth } from '../../context/AuthContext';
import { Card, CardHeader, CardContent } from '../../components/ui';

export const AccountView: React.FC = () => {
  const { user, sendPhoneCode, verifyPhoneCode } = useAuth();

  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '+919876543203');
  const [otpCode, setOtpCode] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'>('idle');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSendOtp = async () => {
    if (!phoneNumber) return;
    setOtpStatus('sending');
    const ok = await sendPhoneCode(phoneNumber);
    if (ok) {
      setOtpStatus('sent');
      setOtpMessage('Verification code sent via Twilio Verify (or Demo code: 123456).');
    } else {
      setOtpStatus('error');
      setOtpMessage('Failed to dispatch code. Please retry.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return;
    setOtpStatus('verifying');
    const ok = await verifyPhoneCode(phoneNumber, otpCode);
    if (ok) {
      setOtpStatus('verified');
      setOtpMessage('Phone number verified successfully.');
    } else {
      setOtpStatus('error');
      setOtpMessage('Invalid or expired verification code.');
    }
  };

  return (
    <AppShell
      pageTitle="Account & Security"
      pageSubtitle="Institutional credentials, biometric consent status, and authentication factors"
    >
      <div className="space-y-6 max-w-4xl">
        {/* Top Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 card-elevation flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <img
              src={
                user?.avatar_url ||
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80'
              }
              alt={user?.full_name}
              className="w-16 h-16 rounded-full object-cover border-2 border-teal shadow-xs"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-textPrimary tracking-tight">{user?.full_name}</h2>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#10233F] text-white">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-textSecondary mt-0.5">
                {user?.institutional_id} • {user?.email}
              </p>
              <div className="mt-2 flex items-center gap-2 text-[11px] text-[#159B68] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Enrolled Institutional Account</span>
              </div>
            </div>
          </div>
        </div>

        {/* Identity & Department Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Card>
            <CardHeader
              title="Academic Department Affiliation"
              subtitle="Departmental governance and cohort assignment"
            />
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">Department</span>
                <span className="font-semibold text-textPrimary">Computer Science & Engineering</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">School</span>
                <span className="font-semibold text-textPrimary">Computing & Artificial Intelligence</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">Academic Term</span>
                <span className="font-semibold text-textPrimary">Spring 2026 (Semester 6)</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-textSecondary">Primary Cohort</span>
                <span className="font-semibold text-textPrimary">Section A (Hall A-101)</span>
              </div>
            </CardContent>
          </Card>

          {/* Security & Cryptographic Factor */}
          <Card>
            <CardHeader
              title="Cryptographic Security"
              subtitle="Password hashing and JWT session management"
            />
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">Password Hashing</span>
                <span className="font-mono text-xs font-semibold text-teal">Argon2id (m=64MB, t=3, p=4)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">Session Token</span>
                <span className="font-mono text-xs font-semibold text-textPrimary">HMAC-SHA256 (60 min)</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-100">
                <span className="text-textSecondary">Refresh Token</span>
                <span className="font-mono text-xs font-semibold text-textPrimary">7-Day Rolling Rotation</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-textSecondary">RBAC Role Authority</span>
                <span className="font-mono text-xs font-semibold text-navy">Scoped by Backend Dependencies</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Biometric Consent & Data Retention Guarantee (PRD FR-17) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 card-elevation space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-[#E6F6F5] text-teal flex-shrink-0">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-textPrimary">Biometric Consent & Retention Policy</h3>
              <p className="text-xs text-textSecondary mt-1 leading-relaxed">
                ClassSphere adheres strictly to institutional privacy principles:
                <br />
                • Enrolled facial images are converted into anonymized 512-dimensional embedding vectors upon consent.
                <br />
                • Original photographs are restricted and inaccessible to public endpoints.
                <br />
                • Attendance telemetry tracks objective events only — no behavioral profiles, disciplinary ratings, or psychological labels are stored.
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-textSecondary">Consent Status:</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-brandSuccess border border-emerald-200">
              Active Institutional Consent on File
            </span>
          </div>
        </div>

        {/* Twilio Phone 2FA Verification */}
        <Card>
          <CardHeader
            title="Two-Factor Ownership Verification"
            subtitle="Twilio Verify SMS verification for account recovery and sensitive actions"
          />
          <CardContent className="space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1">
                  Registered Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal font-mono"
                  placeholder="+919876543201"
                />
              </div>
              <div className="self-end">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpStatus === 'sending'}
                  className="px-4 py-2 bg-teal text-white rounded-lg font-semibold hover:bg-teal-hover transition-colors disabled:opacity-50 cursor-pointer whitespace-nowrap"
                >
                  {otpStatus === 'sending' ? 'Sending Code...' : 'Send Verification Code'}
                </button>
              </div>
            </div>

            {otpStatus !== 'idle' && otpStatus !== 'verified' && (
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <div className="w-full sm:w-48">
                  <label className="block text-[11px] font-semibold text-textSecondary uppercase tracking-wider mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:border-teal font-mono tracking-widest text-center"
                  />
                </div>
                <div className="self-end">
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={!otpCode || otpStatus === 'verifying'}
                    className="px-4 py-2 bg-[#10233F] text-white rounded-lg font-semibold hover:bg-[#183B5B] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {otpStatus === 'verifying' ? 'Verifying...' : 'Submit OTP'}
                  </button>
                </div>
              </div>
            )}

            {otpMessage && (
              <div
                className={`p-3 rounded-lg text-xs ${
                  otpStatus === 'verified'
                    ? 'bg-emerald-50 text-brandSuccess border border-emerald-200'
                    : otpStatus === 'error'
                    ? 'bg-red-50 text-brandDanger border border-red-200'
                    : 'bg-blue-50 text-darkBlue border border-blue-200'
                }`}
              >
                {otpMessage}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
};
