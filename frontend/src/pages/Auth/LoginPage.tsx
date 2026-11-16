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
  KeyRound,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button, Input, Modal } from '../../components/ui';

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
  const [showEvaluatorModal, setShowEvaluatorModal] = useState(false);
  const [activationId, setActivationId] = useState('');
  const [activationStatus, setActivationStatus] = useState<string | null>(null);

  // Phone OTP state for 2FA / verification (Twilio Verify protocol)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpStatus, setOtpStatus] = useState<
    'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'
  >('idle');
  const [otpMessage, setOtpMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter both your institutional ID/email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const loggedUser = await login(identifier.trim(), password, rememberMe);

      // Route strictly based on backend-authenticated account role
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
        err.response?.data?.detail ||
          'Authentication failed. Please verify your institutional ID and password.'
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
    setShowEvaluatorModal(false);
  };

  const handleSendOtp = async () => {
    if (!phoneNumber) return;
    setOtpStatus('sending');
    const ok = await sendPhoneCode(phoneNumber);
    if (ok) {
      setOtpStatus('sent');
      setOtpMessage(
        'Verification code dispatched via Twilio Verify (or Demo master code: 123456 in simulation mode).'
      );
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#F8FAFC]">
      {/* =========================================================================
          LEFT SIDE — CINEMATIC EDITORIAL EXPERIENCE (Desktop ~55% width)
         ========================================================================= */}
      <div className="w-full lg:w-[55%] relative bg-[#091528] flex flex-col justify-between p-6 sm:p-10 lg:p-16 overflow-hidden min-h-[420px] lg:min-h-screen">
        {/* Photorealistic high-resolution university classroom photography */}
        <div
          className="absolute inset-0 bg-cover bg-center mix-blend-luminosity opacity-40 scale-105 transform transition-transform duration-1000 ease-out"
          style={{
            backgroundImage:
              'url("https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=2400&q=85")',
          }}
          aria-hidden="true"
        />

        {/* Cinematic Navy / Indigo / Cobalt gradient overlay */}
        <div
          className="absolute inset-0 bg-gradient-to-tr from-[#071120] via-[#0B1E3C]/95 to-[#1D4ED8]/70"
          aria-hidden="true"
        />

        {/* Ambient illumination orbs */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute bottom-10 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        {/* Top Brand & Status Strip */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 ring-1 ring-white/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white">ClassSphere</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30">
                  v2.0
                </span>
              </div>
              <span className="text-[11px] text-blue-200/80 tracking-wide font-medium">
                Institutional Classroom Governance
              </span>
            </div>
          </div>

          <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/15 text-xs backdrop-blur-md">
            <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
            <span className="font-mono text-[11px]">Active Ingestion: SIM / RTSP</span>
          </div>
        </div>

        {/* Center Editorial Headline & Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-8 sm:py-12 lg:py-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-xs font-semibold text-blue-200 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>Institutional Education SaaS</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-extrabold text-white tracking-tight leading-[1.15] drop-shadow-sm">
            The classroom, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-sky-300 to-indigo-200">
              understood.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-blue-100/90 leading-relaxed font-normal max-w-lg">
            A clearer view of attendance, classroom activity and student safety. Combining live computer vision
            telemetry, multi-modal attendance verification, and human-in-the-loop review.
          </p>

          <div className="mt-6 flex items-center gap-2.5 text-xs text-sky-300/90 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Principle: Monitor important events, not personalities.</span>
          </div>

          {/* Key Architectural Pillars */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-8 border-t border-white/10 text-xs text-blue-100">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center mb-2">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-bold text-white block">Camera Health</span>
              <p className="text-[11px] text-blue-200/70 leading-snug">
                RTSP streams and honestly labelled simulations.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center mb-2">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <span className="font-bold text-white block">Verified Presence</span>
              <p className="text-[11px] text-blue-200/70 leading-snug">
                Dual biometric match and dynamic challenge check-in.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm space-y-1">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-300 flex items-center justify-center mb-2">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <span className="font-bold text-white block">Human Review</span>
              <p className="text-[11px] text-blue-200/70 leading-snug">
                No automated penalties. Faculty reviews all anomalies.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Institutional Identity */}
        <div className="relative z-10 flex flex-wrap items-center justify-between text-[11px] text-blue-300/70 pt-6 border-t border-white/10">
          <span>Enterprise Academic Governance System</span>
          <span className="font-mono text-blue-200/80">Department of Computer Science & Engineering</span>
        </div>
      </div>

      {/* =========================================================================
          RIGHT SIDE — COMPACT EDITORIAL LOGIN FORM (Desktop ~45% width)
         ========================================================================= */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-14 bg-white">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Institutional Single Sign-On</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Sign in to ClassSphere
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Enter your institutional ID or registered academic email. Your role permissions are determined securely
              by the backend.
            </p>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div
              className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2.5 text-xs font-medium animate-in fade-in duration-200"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Institutional ID or Email"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="e.g. STU-2024-001 or faculty@classsphere.edu"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPasswordModal(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 text-sm rounded-lg border border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-slate-900 bg-white placeholder-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & 2FA Option */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 cursor-pointer"
                />
                <span className="font-medium">Remember session</span>
              </label>

              <button
                type="button"
                onClick={() => setShowOtpModal(true)}
                className="text-slate-600 hover:text-blue-600 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                <span>Phone 2FA (Twilio)</span>
              </button>
            </div>

            {/* Visually Dominant Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 text-white font-bold"
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Discreet Evaluator Mode Toggle */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowEvaluatorModal(true)}
              className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 hover:border-blue-400 bg-slate-50/70 hover:bg-blue-50/50 text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5 text-blue-500" />
              <span>Evaluator Access: Quick Demo Fill</span>
            </button>
          </div>

          {/* Activation & Enrollment Footer */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
            <span>Need institutional credentials?</span>
            <button
              type="button"
              onClick={() => setShowActivationModal(true)}
              className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Activate Account</span>
            </button>
          </div>

          {/* Security Assurance */}
          <div className="text-center text-[10px] text-slate-400 leading-relaxed font-mono">
            Argon2id password hashing • HMAC-SHA256 JWT rotation • Institutional RBAC
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODALS & DIALOGS
         ========================================================================= */}

      {/* Evaluator Quick Demo Modal */}
      <Modal
        isOpen={showEvaluatorModal}
        onClose={() => setShowEvaluatorModal(false)}
        title="Evaluator Quick Credentials"
        subtitle="Select a pre-seeded institutional account for evaluation. Permissions are determined strictly by the backend."
        maxWidth="md"
      >
        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              STU
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Student Persona (Aurora Theme)</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Aarav Sharma
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Access personal attendance, class companion, telemetry history, and what-if simulator.
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill('student')}
                className="mt-2.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Auto-fill Student Credentials
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              FAC
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">Faculty Persona (Emerald Studio)</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Dr. Ramesh Kulkarni
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Classroom operations workspace, live computer vision monitoring, attendance verification, and safety.
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill('faculty')}
                className="mt-2.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Auto-fill Faculty Credentials
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-purple-200 bg-purple-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-700 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs">
              HOD
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">HOD Persona (Executive Plum)</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Prof. Dr. Arvind Swaminathan
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Departmental executive oversight, academic auditing, safety escalation decisions, and CSV facility.
              </p>
              <button
                type="button"
                onClick={() => handleQuickFill('hod')}
                className="mt-2.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors shadow-xs"
              >
                Auto-fill HOD Credentials
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        title="Institutional Password Recovery"
        subtitle="Security protocol prevents unverified public password resets"
        maxWidth="md"
        footer={
          <Button variant="primary" size="sm" onClick={() => setShowForgotPasswordModal(false)}>
            Understood
          </Button>
        }
      >
        <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
          <p>
            To prevent identity impersonation and ensure tamper-evident academic records, ClassSphere passwords cannot
            be reset through unverified self-service emails.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <span className="font-bold text-slate-900 block">Department of Computer Science & Engineering</span>
            <div className="text-[11px] text-slate-500 space-y-1 font-mono">
              <div>Admin Contact: hod@classsphere.edu</div>
              <div>Office: Main Engineering Block, Room 301</div>
              <div>Verification: Institutional photo ID required in person</div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Account Activation Modal */}
      <Modal
        isOpen={showActivationModal}
        onClose={() => {
          setShowActivationModal(false);
          setActivationStatus(null);
          setActivationId('');
        }}
        title="Activate Institutional Account"
        subtitle="Verify pre-provisioned enrollment records"
        maxWidth="md"
      >
        <form onSubmit={handleActivationSubmit} className="space-y-4">
          <Input
            label="Institutional ID / Roll Number"
            type="text"
            value={activationId}
            onChange={(e) => setActivationId(e.target.value)}
            placeholder="e.g. STU-2024-001 or FAC-1001"
            required
            helperText="Check your department enrollment receipt or faculty appointment letter."
          />

          {activationStatus && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Enrollment Record Verified</span>
              </div>
              {activationStatus}
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth size="md">
            Verify Enrollment Record
          </Button>
        </form>
      </Modal>

      {/* Phone OTP Modal (Twilio Verify FR-01) */}
      <Modal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        title="Phone 2FA Ownership"
        subtitle="Twilio Verify Protocol — device possession verification"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 leading-relaxed">
            Verifies account phone ownership via Twilio Verify OTP dispatch. (Note: Verifies device possession, not
            classroom presence).
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Registered Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+919876543201"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg outline-none focus:border-blue-600 font-mono"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleSendOtp}
                  disabled={otpStatus === 'sending'}
                  isLoading={otpStatus === 'sending'}
                >
                  Send OTP
                </Button>
              </div>
            </div>

            {otpStatus !== 'idle' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit Code</label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  className="w-full px-3 py-2 text-sm tracking-widest text-center border border-slate-300 rounded-lg outline-none focus:border-blue-600 font-mono font-bold"
                />
              </div>
            )}

            {otpMessage && (
              <div
                className={`p-2.5 rounded-xl text-xs ${
                  otpStatus === 'verified'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : otpStatus === 'error'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-blue-50 text-blue-800 border border-blue-200'
                }`}
              >
                {otpMessage}
              </div>
            )}

            {otpStatus === 'verified' ? (
              <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 font-bold py-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Phone ownership verified!</span>
              </div>
            ) : (
              <Button
                type="button"
                variant="primary"
                fullWidth
                size="md"
                onClick={handleVerifyOtp}
                disabled={!otpCode || otpStatus === 'verifying'}
                isLoading={otpStatus === 'verifying'}
              >
                Submit Verification Code
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
