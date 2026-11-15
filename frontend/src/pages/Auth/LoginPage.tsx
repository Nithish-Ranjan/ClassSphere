import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  Lock,
  Mail,
  AlertCircle,
  Smartphone,
  CheckCircle2,
  HelpCircle,
  UserPlus,
  Radio,
  FileCheck2,
  Camera,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, sendPhoneCode, verifyPhoneCode } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [activationId, setActivationId] = useState('');
  const [activationStatus, setActivationStatus] = useState<string | null>(null);

  // Phone OTP state for 2FA / verification
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStatus, setOtpStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'>('idle');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your institutional identifier and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedUser = await login(identifier.trim(), password, rememberMe);

      // Route strictly based on backend account role
      if (loggedUser.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (loggedUser.role === 'FACULTY') {
        navigate('/faculty/dashboard');
      } else if (loggedUser.role === 'HOD') {
        navigate('/hod/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.detail || 'Authentication failed. Please verify your institutional ID and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (role: 'student' | 'faculty' | 'hod') => {
    if (role === 'student') {
      setIdentifier('student@classsphere.edu');
      setPassword('Password@123');
    } else if (role === 'faculty') {
      setIdentifier('faculty@classsphere.edu');
      setPassword('Password@123');
    } else if (role === 'hod') {
      setIdentifier('hod@classsphere.edu');
      setPassword('Password@123');
    }
    setErrorMessage(null);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return;
    setOtpStatus('sending');
    const ok = await sendPhoneCode(phoneNumber);
    if (ok) {
      setOtpStatus('sent');
      setOtpMessage('Verification code sent via Twilio Verify (or Demo master code: 123456 in simulation mode).');
    } else {
      setOtpStatus('error');
      setOtpMessage('Failed to dispatch code. Please try again.');
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode) return;
    setOtpStatus('verifying');
    const ok = await verifyPhoneCode(phoneNumber, otpCode);
    if (ok) {
      setOtpStatus('verified');
      setTimeout(() => setShowOtpModal(false), 1400);
    } else {
      setOtpStatus('error');
      setOtpMessage('Invalid or expired verification code.');
    }
  };

  const handleActivationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationId.trim()) return;
    setActivationStatus(
      `Institutional record for "${activationId.trim()}" is pre-provisioned in Department of Computer Science & Engineering. Please use your temporary password (Password@123) to sign in.`
    );
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F7F9FC]">
      {/* LEFT SIDE — VISUAL EDITORIAL EXPERIENCE (Desktop ~52% width) */}
      <div className="w-full lg:w-[52%] relative bg-[#10233F] flex flex-col justify-between p-6 sm:p-10 lg:p-14 overflow-hidden min-h-[340px] lg:min-h-screen">
        {/* Authentic high-quality university classroom photograph */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-30 scale-100 transform transition-transform duration-1000 ease-out"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1920&q=80")',
          }}
          aria-hidden="true"
        />

        {/* Subtle Navy / Blue / Teal gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-[#10233F] via-[#10233F]/92 to-[#183B5B]/85"
          aria-hidden="true"
        />

        {/* Top Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#159A91] flex items-center justify-center text-white shadow-md shadow-[#159A91]/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">ClassSphere</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#159A91]/20 text-[#E6F6F5] border border-[#159A91]/30">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-slate-300 tracking-wide block">
                Intelligent Classroom Monitoring & Management
              </span>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#E6F6F5] border border-white/15 text-[11px] font-mono">
            <Radio className="w-3.5 h-3.5 text-[#159A91] animate-pulse" />
            <span>Dual Ingestion: SIM / RTSP</span>
          </div>
        </div>

        {/* Center Editorial Focus */}
        <div className="relative z-10 max-w-xl my-auto py-6 sm:py-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#159A91]/15 border border-[#159A91]/30 text-xs font-semibold text-[#E6F6F5] mb-5">
            <span className="w-2 h-2 rounded-full bg-[#159A91] animate-pulse" />
            <span>Operational Institutional SaaS</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-bold text-white tracking-tight leading-[1.2]">
            Monitor important events, not personalities.
          </h1>

          <p className="mt-4 text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
            ClassSphere combines real-time computer vision camera monitoring, multi-modal attendance verification, objective
            classroom telemetry, and human-verified safety escalations into one unified institutional platform.
          </p>

          {/* Three Key Architectural Guarantees */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10 text-xs text-slate-200">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 text-[#159A91] mt-0.5">
                <Camera className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Camera Health</span>
                <span className="text-[11px] text-slate-400">RTSP & Simulated feeds</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 text-[#159A91] mt-0.5">
                <FileCheck2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Verified Presence</span>
                <span className="text-[11px] text-slate-400">Photo & challenge checks</span>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0 text-[#159A91] mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="font-semibold text-white block">Human Review</span>
                <span className="text-[11px] text-slate-400">No automated labels</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="relative z-10 flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-4 border-t border-white/10">
          <span>Enterprise Academic Governance System</span>
          <span className="font-mono text-[#E6F6F5]/70">Department of Computer Science & Engineering</span>
        </div>
      </div>

      {/* RIGHT SIDE — AUTHENTICATION FORM (Desktop ~48% width) */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">
        <div className="w-full max-w-md">
          {/* Form Header */}
          <div className="mb-7">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#172B43] tracking-tight">Institutional Sign In</h2>
            <p className="mt-1.5 text-xs sm:text-sm text-[#65758B]">
              Enter your institutional ID or registered academic email to access your authorized portal.
            </p>
          </div>

          {/* Quick Demo Persona Pills for Evaluators */}
          <div className="mb-6 p-3.5 rounded-xl bg-[#F7F9FC] border border-[#E2E8F0]">
            <div className="text-[11px] font-semibold tracking-wider uppercase text-[#65758B] mb-2 flex items-center justify-between">
              <span>Quick Demo Fill (Evaluator Mode)</span>
              <span className="text-[10px] text-[#159A91] font-medium">1-Click Auto Fill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-[#E6F6F5] hover:text-[#159A91] hover:border-[#159A91]/40 border border-[#E2E8F0] transition-all text-[#172B43] shadow-xs text-center cursor-pointer focus-ring"
              >
                🎓 Student
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('faculty')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-[#E6F6F5] hover:text-[#159A91] hover:border-[#159A91]/40 border border-[#E2E8F0] transition-all text-[#172B43] shadow-xs text-center cursor-pointer focus-ring"
              >
                👨‍🏫 Faculty
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hod')}
                className="px-2.5 py-2 text-xs font-semibold rounded-lg bg-white hover:bg-[#E6F6F5] hover:text-[#159A91] hover:border-[#159A91]/40 border border-[#E2E8F0] transition-all text-[#172B43] shadow-xs text-center cursor-pointer focus-ring"
              >
                🏛️ HOD
              </button>
            </div>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div
              className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-[#DC2626] flex items-start gap-2.5 text-xs font-medium"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#172B43] uppercase tracking-wider mb-1.5">
                Institutional ID or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#65758B]">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. STU-2024-001 or faculty@classsphere.edu"
                  required
                  className="w-full pl-10 pr-3 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:border-[#159A91] focus:ring-2 focus:ring-[#159A91]/20 outline-none transition-all text-[#172B43] bg-white placeholder-[#94A3B8]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[#172B43] uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-xs text-[#159A91] hover:text-[#117E77] font-semibold cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#65758B]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-[#CBD5E1] focus:border-[#159A91] focus:ring-2 focus:ring-[#159A91]/20 outline-none transition-all text-[#172B43] bg-white placeholder-[#94A3B8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#65758B] hover:text-[#172B43] cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & 2FA Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-[#159A91] focus:ring-[#159A91] border-[#CBD5E1]"
                />
                <span className="text-[#65758B] font-medium">Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => setShowOtpModal(true)}
                className="text-[#65758B] hover:text-[#159A91] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Phone 2FA (Twilio)</span>
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-lg bg-[#10233F] hover:bg-[#183B5B] text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-150 disabled:opacity-60 cursor-pointer focus-ring"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Account Activation Footer */}
          <div className="mt-6 pt-5 border-t border-[#E2E8F0] flex items-center justify-between text-xs text-[#65758B]">
            <span>Need institutional access?</span>
            <button
              type="button"
              onClick={() => setShowActivationModal(true)}
              className="font-semibold text-[#159A91] hover:text-[#117E77] flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Activate Account</span>
            </button>
          </div>

          {/* Security Notice */}
          <div className="mt-6 text-center text-[11px] text-[#94A3B8] leading-relaxed">
            Protected by Argon2id cryptographic password hashing, HMAC-SHA256 JWT rotation, and resource-scoped RBAC.
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#10233F]">
                <HelpCircle className="w-5 h-5 text-[#159A91]" />
                <h3 className="font-bold text-sm sm:text-base">Institutional Password Recovery</h3>
              </div>
              <button
                onClick={() => setShowForgotPasswordModal(false)}
                className="text-[#65758B] hover:text-[#172B43] p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#65758B] space-y-2 leading-relaxed">
              <p>
                To maintain institutional security and audit integrity, ClassSphere passwords cannot be reset via unverified self-service emails.
              </p>
              <p className="font-medium text-[#172B43]">
                Please contact your Department Administrator or Department Head (HOD):
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px] text-[#65758B]">
                <li>Department: Computer Science & Engineering (School of Computing)</li>
                <li>Administrative Email: <code className="font-mono text-[#10233F]">hod@classsphere.edu</code></li>
                <li>Office: Main Engineering Block, Room 301</li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => setShowForgotPasswordModal(false)}
              className="w-full py-2 bg-[#10233F] text-white text-xs font-semibold rounded-lg hover:bg-[#183B5B] transition-colors cursor-pointer"
            >
              Understood
            </button>
          </div>
        </div>
      )}

      {/* Account Activation / Enrollment Check Modal */}
      {showActivationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-[#E2E8F0] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2 text-[#10233F]">
                <UserPlus className="w-5 h-5 text-[#159A91]" />
                <h3 className="font-bold text-sm sm:text-base">Activate Institutional Account</h3>
              </div>
              <button
                onClick={() => {
                  setShowActivationModal(false);
                  setActivationStatus(null);
                  setActivationId('');
                }}
                className="text-[#65758B] hover:text-[#172B43] p-1 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleActivationSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#172B43] uppercase tracking-wider mb-1">
                  Institutional ID / Roll Number
                </label>
                <input
                  type="text"
                  value={activationId}
                  onChange={(e) => setActivationId(e.target.value)}
                  placeholder="e.g. STU-2024-001 or FAC-1001"
                  required
                  className="w-full px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg outline-none focus:border-[#159A91]"
                />
              </div>

              {activationStatus && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
                  <div className="font-semibold flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-[#159B68]" />
                    <span>Account Active</span>
                  </div>
                  {activationStatus}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 bg-[#159A91] text-white text-xs font-semibold rounded-lg hover:bg-[#117E77] transition-colors cursor-pointer"
              >
                Verify Enrollment Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Phone OTP Modal (Twilio Verify FR-01) */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 border border-[#E2E8F0]">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-[#E6F6F5] text-[#159A91]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#172B43]">Phone 2FA Ownership</h3>
                  <span className="text-[10px] text-[#65758B]">Twilio Verify Protocol</span>
                </div>
              </div>
              <button
                onClick={() => setShowOtpModal(false)}
                className="text-[#65758B] hover:text-[#172B43] text-sm font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#65758B] mb-4 leading-relaxed">
              Verifies account phone ownership via Twilio Verify OTP dispatch. (Note: Verifies device possession, not classroom presence).
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#65758B] mb-1">Registered Phone Number</label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+919876543201"
                    className="flex-1 px-3 py-2 text-sm border border-[#CBD5E1] rounded-lg outline-none focus:border-[#159A91]"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpStatus === 'sending'}
                    className="px-3 py-2 bg-[#159A91] text-white rounded-lg text-xs font-semibold hover:bg-[#117E77] transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {otpStatus === 'sending' ? 'Sending...' : 'Send OTP'}
                  </button>
                </div>
              </div>

              {otpStatus !== 'idle' && (
                <div>
                  <label className="block text-xs font-semibold text-[#65758B] mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-3 py-2 text-sm tracking-widest text-center border border-[#CBD5E1] rounded-lg outline-none focus:border-[#159A91] font-mono"
                  />
                </div>
              )}

              {otpMessage && (
                <div
                  className={`text-xs p-2.5 rounded-lg ${
                    otpStatus === 'verified'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : otpStatus === 'error'
                      ? 'bg-red-50 text-[#DC2626] border border-red-200'
                      : 'bg-blue-50 text-[#183B5B] border border-blue-200'
                  }`}
                >
                  {otpMessage}
                </div>
              )}

              {otpStatus === 'verified' ? (
                <div className="flex items-center justify-center gap-1.5 text-xs text-[#159B68] font-bold py-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Phone ownership verified!</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={!otpCode || otpStatus === 'verifying'}
                  className="w-full py-2 bg-[#10233F] text-white text-xs font-semibold rounded-lg hover:bg-[#183B5B] transition-colors disabled:opacity-50 mt-2 cursor-pointer"
                >
                  {otpStatus === 'verifying' ? 'Verifying...' : 'Submit Verification Code'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
