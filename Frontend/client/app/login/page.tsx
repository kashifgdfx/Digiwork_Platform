'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setAuthToken } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { PasswordInput } from '@/components/PasswordInput';

export default function LoginPage() {
  const router = useRouter();
  const { refreshCurrentUser } = useApp();
  const { error: toastError, success: toastSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid email or password');
      }

      setAuthToken(data.token || null);
      const user = await refreshCurrentUser();
      if (!user) {
        throw new Error('Login succeeded, but the user session could not be loaded.');
      }

      toastSuccess(`Welcome back, ${user.name || 'User'}!`);
      router.replace('/');
    } catch (err: any) {
      toastError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Left decorative branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-emerald-100 mb-4 border border-white/10 shadow-sm">
            Welcome Back
          </span>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-3">Sign in to your account.</h1>
          <p className="text-emerald-100/90 text-sm xl:text-base max-w-sm leading-relaxed">
            Access your dashboard, manage your workflows, and continue right where you left off.
          </p>
        </div>

        <div className="relative z-10 text-xs text-emerald-200/70 font-medium">
          &copy; {new Date().getFullYear()} All rights reserved. Secure encrypted authentication.
        </div>
      </div>

      {/* Right form container structured to fit inside 100vh with zero overflow */}
      <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/80 p-6 sm:p-8 flex flex-col justify-center my-auto backdrop-blur-xl">
          <div className="mb-6 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Sign in to your account</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                Sign up
              </Link>
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50 hover:bg-white"
                placeholder="name@example.com"
              />
            </div>

            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              required
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">Protected by secure auth</span>
              <Link href="/forgot-password" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                Forgot Password?
              </Link>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}