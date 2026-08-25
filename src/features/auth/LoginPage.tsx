import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, CheckCircle, ArrowLeft, Loader2, Timer, Sparkles, Award, ShieldCheck, Zap, BookOpen } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import { authService, type AuthResponse } from './services/auth.service';
import logoImg from '../../assets/logo.jpg';

type Step = 'email' | 'otp';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 3-minute countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTP input refs for auto-advance behaviour
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // ─────────────────────────────────────────
  // Timer helpers
  // ─────────────────────────────────────────
  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = () => {
    clearTimer();
    setSecondsRemaining(180); // 3 minutes
    timerRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearTimer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTimer = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimer();
  }, []);

  // ─────────────────────────────────────────
  // Step 1 — Send OTP
  // ─────────────────────────────────────────
  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    setIsLoading(true);
    try {
      const message = await authService.requestOtp(trimmedEmail);
      setSuccessMsg(message);
      setStep('otp');
      setOtp('');
      startTimer();
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'Failed to send OTP.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // Step 2 — Verify OTP & Sign In
  // ─────────────────────────────────────────
  const doVerifyOtp = useCallback(async (otpValue: string) => {
    setError(null);

    if (otpValue.replace(/\s/g, '').length !== 4) {
      setError('Please enter the complete 4-digit OTP');
      return;
    }

    if (secondsRemaining === 0) {
      setError('OTP has expired. Please click Resend OTP.');
      return;
    }

    setIsLoading(true);
    try {
      const data: AuthResponse = await authService.verifyOtp(email.trim(), otpValue.trim());
      const token = data.token ?? '';
      const roles: string[] = data.roles ?? [];
      const userType: string = data.userType ?? '';
      const isViceCaptain = data.teamRole === 'VICE_CAPTAIN' || data.isViceCaptain === true;
      const isCaptainRole = data.isCaptain === true || data.teamRole === 'CAPTAIN';
      // Vice Captains are routed to the Captain portal
      const isCaptain = isCaptainRole || isViceCaptain;

      // ── Determine role (mirrors Flutter routing logic) ──
      const isSuperAdmin = roles.some(r =>
        r === 'ROLE_SUPERADMIN' || r === 'ROLE_SUPER_ADMIN' || r === 'SUPERADMIN' || r === 'SUPER_ADMIN'
      );
      const isHOD = roles.some(r => r === 'ROLE_HOD' || r === 'HOD') || userType === 'HOD' || (Array.isArray(data.subRoles) && data.subRoles.includes('HOD'));
      const isAdmin = isSuperAdmin || isHOD || roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN') || userType === 'ADMIN';
      const isTeacher = !isAdmin && (roles.includes('ROLE_TEACHER') || roles.includes('ROLE_DISCIPLINE_COMMITTEE') || userType === 'TEACHER');

      let finalRole: string;
      if (isAdmin) {
        finalRole = 'ADMIN';
      } else if (isTeacher) {
        finalRole = 'TEACHER';
      } else if (isCaptain || userType === 'CAPTAIN' || userType === 'VICE_CAPTAIN') {
        finalRole = 'CAPTAIN';
      } else {
        finalRole = 'STUDENT';
      }

      // ── Build user object for auth context ──
      const mergedRoles = Array.from(new Set([...roles, finalRole, `ROLE_${finalRole}`]));
      const user = {
        ...data,
        role: finalRole,
        roles: mergedRoles,
        isCaptain: finalRole === 'CAPTAIN',   // true for both Captain AND Vice Captain
        isViceCaptain,                          // distinguish Vice Captain within the portal
        isSuperAdmin,
        isHOD,
        name: data.fullName ?? data.username,
      };

      // Store token + user in localStorage (consumed by authContext)
      localStorage.setItem('spdms_token', token);
      localStorage.setItem('spdms_user', JSON.stringify(user));

      login(token, user);
      clearTimer();

      // ── Navigate to the correct dashboard ──
      navigate(`/${finalRole.toLowerCase()}`, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message ?? err.message ?? 'OTP verification failed.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [email, secondsRemaining, login, navigate]);

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await doVerifyOtp(otp);
  };

  // ─────────────────────────────────────────
  // OTP box input handler — auto-verify on completion
  // ─────────────────────────────────────────
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // only single digit
    const chars = otp.split('');
    chars[index] = value;
    const next = chars.join('').padEnd(4, ' ').slice(0, 4);
    setOtp(next);

    // advance focus
    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all 4 digits are filled
    const filledOtp = next.replace(/\s/g, '');
    if (filledOtp.length === 4 && value) {
      // Small delay so the UI updates before the async call
      setTimeout(() => doVerifyOtp(filledOtp), 150);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index]?.trim() && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  // ─────────────────────────────────────────
  // Render: 2-Column Enterprise Web View
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen w-full flex bg-[#0F172A] text-slate-100 overflow-x-hidden">
      
      {/* ── LEFT PANEL: Branding & Feature Showcase (Visible on Desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-5/12 bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0F172A] p-10 flex-col justify-between relative border-r border-slate-800 shadow-2xl">
        {/* Subtle Background Glow Spheres */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#1E293B]/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-slate-700/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 backdrop-blur-md text-xs font-bold text-slate-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>JJCET Official Student Portal</span>
          </div>

          <div className="mt-8 flex items-center gap-3.5">
            <div className="w-20 h-20 rounded-2xl bg-white p-2.5 flex items-center justify-center border border-slate-700 shadow-xl shrink-0">
              <img src={logoImg} alt="PragatiX Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">PragatiX</h1>
              <p className="text-xs font-mono text-slate-400 font-semibold">Academic Excellence Platform</p>
            </div>
          </div>
        </div>

        {/* Feature Highlights Showcase Grid */}
        <div className="relative z-10 space-y-4 my-auto py-8">
          <div className="space-y-2">
            <h2 className="text-2xl xl:text-3xl font-black text-white tracking-tight leading-tight">
              Empowering Student Progression & Leadership
            </h2>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">
              Track real-time XP accumulation, milestone stages, squad leaderboards, and verified period attendance.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-amber-400 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">XP Progression</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Stage milestones & point reviews</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-blue-400 shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Leaderboards</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Departmental & section rankings</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-emerald-400 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Squad Leadership</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Captain & Vice Captain desk</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-slate-700/80 border border-slate-600 flex items-center justify-center text-purple-400 shrink-0">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Attendance Sync</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">Period tracking & target calculator</p>
              </div>
            </div>
          </div>
        </div>

        {/* Left Footer */}
        <div className="relative z-10 pt-4 border-t border-slate-800 text-[11px] font-medium text-slate-400 flex items-center justify-between">
          <span>© 2026 PragatiX Portal</span>
          <span>JJCET Institution</span>
        </div>
      </div>

      {/* ── RIGHT PANEL: Clean Web Auth Form ── */}
      <div className="w-full lg:w-1/2 xl:w-7/12 bg-[#F8FAFC] text-slate-900 flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative overflow-y-auto min-h-screen">
        
        {/* Top Header Row */}
        <div className="flex items-center justify-between w-full mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Landing Page</span>
          </Link>

          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-xs">
            <Lock className="w-3.5 h-3.5 text-slate-700" />
            <span>Secure Institution Portal</span>
          </div>
        </div>

        {/* Main Auth Form Container */}
        <div className="max-w-md w-full mx-auto bg-white rounded-3xl p-8 sm:p-10 shadow-[0_10px_25px_rgba(0,0,0,0.05)] border border-slate-200 my-auto">
          
          {/* Logo & Header */}
          <div className="flex flex-col items-center mb-6 text-center">
            <div className="w-28 h-28 rounded-3xl bg-white shadow-lg p-3 flex items-center justify-center border border-slate-200 mb-4">
              <img src={logoImg} alt="PragatiX Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              PragatiX <span className="font-medium text-slate-600">Sign In</span>
            </h2>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {step === 'email'
                ? 'Enter your registered email to receive an authentication OTP'
                : 'Enter the 4-digit security code sent to your email'}
            </p>
          </div>

          {/* Progress Step Bar */}
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 bg-[#1E293B]`} />
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${step === 'otp' ? 'bg-[#1E293B]' : 'bg-slate-200'}`} />
          </div>

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-5 p-3.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold flex items-start gap-2 border border-emerald-200 shadow-xs">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 text-rose-800 rounded-xl text-xs font-bold flex items-start gap-2 border border-rose-200 shadow-xs">
              <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Email Input Form ── */}
          {step === 'email' && (
            <form onSubmit={handleRequestOtp} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    autoFocus
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null); }}
                    placeholder="e.g. student@jjcet.ac.in"
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E293B] focus:border-[#1E293B] outline-none text-slate-900 text-sm font-semibold transition-all bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <button
                id="send-otp-btn"
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#1E293B] hover:bg-[#0F172A] active:bg-black text-white text-sm font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending OTP…</span>
                  </>
                ) : (
                  <span>Send Security OTP</span>
                )}
              </button>
            </form>
          )}

          {/* ── Step 2: OTP Verification Form ── */}
          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 text-center">
                  Enter 4-Digit Security Code
                </label>
                <div className="flex justify-center gap-3">
                  {[0, 1, 2, 3].map(i => (
                    <input
                      key={i}
                      ref={el => { otpRefs.current[i] = el; }}
                      id={`otp-digit-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={otp[i]?.trim() ?? ''}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                      className="w-14 h-14 text-center text-2xl font-black border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1E293B] focus:border-[#1E293B] outline-none text-slate-900 bg-slate-50 focus:bg-white transition-all"
                    />
                  ))}
                </div>
              </div>

              {/* Timer & Resend */}
              <div className="flex items-center justify-between text-xs font-bold pt-1">
                <div className="flex items-center gap-1.5">
                  <Timer className={`w-4 h-4 ${secondsRemaining > 0 ? 'text-[#1E293B]' : 'text-slate-400'}`} />
                  {secondsRemaining > 0 ? (
                    <span className="text-slate-700">Expires in: {formatTimer(secondsRemaining)}</span>
                  ) : (
                    <span className="text-slate-400">OTP expired</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  disabled={secondsRemaining > 0 || isLoading}
                  className="text-[#1E293B] hover:text-black font-extrabold disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Resend OTP
                </button>
              </div>

              {/* Change email link */}
              <button
                type="button"
                onClick={() => {
                  setStep('email');
                  setOtp('');
                  setError(null);
                  setSuccessMsg(null);
                  clearTimer();
                  setSecondsRemaining(0);
                }}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer py-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Change Email Address</span>
              </button>

              {/* Verify & Sign In */}
              <button
                id="verify-otp-btn"
                type="submit"
                disabled={isLoading || otp.replace(/\s/g, '').length < 4 || secondsRemaining === 0}
                className="w-full bg-[#1E293B] hover:bg-[#0F172A] active:bg-black text-white text-sm font-extrabold py-3.5 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying Code…</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Verify &amp; Enter Portal</span>
                  </>
                )}
              </button>
            </form>
          )}

          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-[11px] font-medium text-slate-400">
              🔒 Official 256-Bit AES-GCM Encrypted Portal Session
            </p>
          </div>
        </div>

        {/* Right Footer */}
        <footer className="mt-8 text-center" role="contentinfo">
          <p className="text-[11px] font-semibold text-slate-400">
            © 2026 PragatiX &bull; JJCET Academic Portal. All rights reserved.
          </p>
        </footer>
      </div>

    </div>
  );
}
