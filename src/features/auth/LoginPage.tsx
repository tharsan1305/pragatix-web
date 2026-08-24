import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ShieldAlert, CheckCircle, ArrowLeft, Loader2, Timer } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import { authService, type AuthResponse } from './services/auth.service';
import logoImg from '../../assets/logo.png';
import { Link } from 'react-router-dom';

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
      const isCaptain = data.isCaptain === true || data.teamRole === 'CAPTAIN' || data.teamRole === 'VICE_CAPTAIN';

      // ── Determine role (mirrors Flutter routing logic) ──
      const isSuperAdmin = roles.some(r =>
        r === 'ROLE_SUPERADMIN' || r === 'ROLE_SUPER_ADMIN' || r === 'SUPERADMIN' || r === 'SUPER_ADMIN'
      );
      const isAdmin = isSuperAdmin || roles.some(r => r === 'ROLE_ADMIN' || r === 'ADMIN') || userType === 'ADMIN';
      const isTeacher = !isAdmin && (roles.includes('ROLE_TEACHER') || roles.includes('ROLE_DISCIPLINE_COMMITTEE') || userType === 'TEACHER');

      let finalRole: string;
      if (isAdmin) {
        finalRole = 'ADMIN';
      } else if (isTeacher) {
        finalRole = 'TEACHER';
      } else if (isCaptain || userType === 'CAPTAIN') {
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
        isCaptain: finalRole === 'CAPTAIN',
        isSuperAdmin,
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
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 px-4 py-8 relative">
      {/* Top Left Navigation Back to Landing */}
      <div className="absolute top-6 left-6 z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 type-fine font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </Link>
      </div>

      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 my-auto">
        {/* ── Logo & Title ── */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-24 h-24 rounded-2xl bg-white shadow-lg p-2 flex items-center justify-center overflow-hidden border border-slate-200 mb-4">
            <img src={logoImg} alt="PragatiX Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="type-h2 tracking-tight">
            <span className="text-indigo-600 font-bold">PragatiX</span>{' '}
            <span className="text-slate-800">Sign In</span>
          </h1>
          <p className="mt-1.5 type-body-sm text-slate-500">
            {step === 'email'
              ? 'Enter your email to receive an OTP'
              : 'Enter the 4-digit OTP sent to your email'}
          </p>
        </div>

        {/* ── Step indicator ── */}
        <div className="flex items-center gap-2 mb-6">
          <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${step === 'email' ? 'bg-indigo-600' : 'bg-indigo-600'}`} />
          <div className={`flex-1 h-1 rounded-full transition-all duration-300 ${step === 'otp' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
        </div>

        {/* ── Success Banner ── */}
        {successMsg && (
          <div className="mb-5 p-3 bg-green-50 text-green-700 rounded-xl type-body-sm flex items-start gap-2 border border-green-100">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <div className="mb-5 p-3 bg-red-50 text-red-600 rounded-xl type-body-sm flex items-start gap-2 border border-red-100">
            <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Step 1: Email Form ── */}
        {step === 'email' && (
          <form onSubmit={handleRequestOtp} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="block type-form-label text-slate-700 mb-1.5">
                Email
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
                  placeholder="e.g. user@example.com"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 type-body-sm transition-all"
                />
              </div>
            </div>

            <button
              id="send-otp-btn"
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white type-btn py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-200 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending OTP…
                </>
              ) : (
                'Send OTP'
              )}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP Form ── */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            {/* OTP digit boxes */}
            <div>
              <label className="block type-form-label text-slate-700 mb-3 text-center">
                Enter 4-digit OTP
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
                    className="w-14 h-14 text-center type-h3 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* ── Timer & Resend ── */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 type-caption">
                <Timer className={`w-4 h-4 ${secondsRemaining > 0 ? 'text-indigo-600' : 'text-red-500'}`} />
                {secondsRemaining > 0 ? (
                  <span className="text-slate-700">Expires in: {formatTimer(secondsRemaining)}</span>
                ) : (
                  <span className="text-red-500">OTP expired</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRequestOtp()}
                disabled={secondsRemaining > 0 || isLoading}
                className="type-btn text-indigo-600 hover:text-indigo-800 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
              className="w-full flex items-center justify-center gap-1.5 type-btn text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Change Email
            </button>

            {/* Verify & Sign In */}
            <button
              id="verify-otp-btn"
              type="submit"
              disabled={isLoading || otp.replace(/\s/g, '').length < 4 || secondsRemaining === 0}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white type-btn py-3 rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-indigo-200 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Verify &amp; Sign In
                </>
              )}
            </button>
          </form>
        )}

        {/* ── Footer ── */}
        <footer className="mt-8 pt-4 border-t border-slate-100" role="contentinfo">
          <p className="text-center type-fine text-slate-400">
            © 2026 PragatiX · JJCET. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
