import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, User, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import { authService } from './services/auth.service';

import logoImg from '../../assets/logo.jpg';

const loginSchema = z.object({
  role: z.enum(['Student', 'Teacher', 'Admin']),
  username: z.string().min(1, 'Username / ID is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [_turnstileReset, setTurnstileReset] = useState<number>(0);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'Student',
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError(null);
    try {
      const response = await authService.login({ ...data, turnstileToken });
      const token = response.token || (response as any).accessToken || (response as any).jwt || '';
      if (token) {
        localStorage.setItem('spdms_token', token);
        localStorage.setItem('spdms_user', JSON.stringify(response));
      }
      
      // Determine the user's role from the backend response
      let finalRole = 'STUDENT';
      const userType = (response as any).userType || '';
      const roles: string[] = (response as any).roles || [];
      const isCaptain = (response as any).isCaptain === true || 
                        (response as any).captain === true || 
                        (response as any).teamRole === 'CAPTAIN' || 
                        (response as any).teamRole === 'VICE_CAPTAIN';

      if (data.role === 'Admin' || data.role === 'Teacher') {
        if (roles.includes('ROLE_ADMIN') || userType === 'ADMIN') {
          finalRole = 'ADMIN';
        } else if (userType === 'TEACHER' || roles.includes('ROLE_TEACHER') || roles.includes('ROLE_DISCIPLINE_COMMITTEE')) {
          finalRole = 'TEACHER';
        } else {
          // If response contains admin or teacher data, allow login
          finalRole = data.role === 'Admin' ? 'ADMIN' : 'TEACHER';
        }
      } else {
        finalRole = (isCaptain || userType === 'CAPTAIN') ? 'CAPTAIN' : 'STUDENT';
      }

      // Construct complete user object
      const user = {
        ...(typeof response === 'object' ? response : {}),
        id: (response as any).id || (response as any).studentId || (response as any).username || 'unknown',
        studentId: (response as any).username || (response as any).studentId || (response as any).id,
        username: data.username,
        role: finalRole,
        roles: [finalRole, `ROLE_${finalRole}`],
        isCaptain: finalRole === 'CAPTAIN',
        name: (response as any).fullName || (response as any).name || (response as any).firstName || data.username,
      };
      
      login(token, user);
      
      // Navigate to the correct dashboard with history replacement
      navigate(`/${finalRole.toLowerCase()}`, { replace: true });
      
    } catch (err: any) {
      setError(err.message || 'Connection failed. Ensure backend is running.');
      setTurnstileReset((prev) => prev + 1);
      setTurnstileToken('');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 py-8">
      <div className="bg-[#f3f4f7] rounded-[36px] p-8 max-w-md w-full shadow-2xl border border-white/20">
        {/* Header Section matching reference image */}
        {/* Header Section matching PragatiX official branding */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-3xl bg-white shadow-xl p-3 flex items-center justify-center overflow-hidden border border-slate-200/80 mb-3">
            <img 
              src={logoImg} 
              alt="PragatiX Logo" 
              className="w-full h-full object-contain" 
            />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight">
            <span className="text-indigo-600 font-black">PragatiX</span>{' '}
            <span className="text-slate-800 font-extrabold">Login</span>
          </h2>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center gap-2 border border-red-100">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Role</label>
            <div className="relative">
              <select
                {...register('role')}
                onChange={() => setError(null)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none appearance-none text-gray-900"
              >
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username / ID / Email</label>
            <div className="relative">
              <input
                type="text"
                autoComplete="off"
                {...register('username')}
                onFocus={() => setError(null)}
                placeholder="Enter your Username, ID or Email"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-gray-900"
              />
              <User className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type="password"
                autoComplete="new-password"
                {...register('password')}
                onFocus={() => setError(null)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none text-gray-900"
              />
              <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-3" />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-sm"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs font-medium text-gray-400 pt-4 border-t border-gray-100">
          JJCET © 2026 All rights reserved
        </div>
      </div>
    </div>
  );
}
