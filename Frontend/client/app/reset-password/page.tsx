'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { PasswordInput } from '@/components/PasswordInput';

function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const { error: toastError, success: toastSuccess } = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toastError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      toastSuccess('Password reset successfully! Redirecting to login...');

      // Success hone ke baad login page par redirect kar dega
      setTimeout(() => {
        router.push('/login');
      }, 1500);

    } catch (err: any) {
      toastError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PasswordInput
        label="New Password"
        value={password}
        onChange={setPassword}
        placeholder="Enter new password"
        name="password"
        autoComplete="new-password"
        required
      />

      <PasswordInput
        label="Confirm New Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        required
      />

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Resetting password...' : 'Reset Password'}
        </button>
      </div>
    </form>
  );
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [validating, setValidating] = useState(true);
  const [validToken, setValidToken] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setError('Missing reset token.');
        setValidating(false);
        return;
      }

      try {
        const response = await apiFetch(`/api/auth/validate-reset-token/${encodeURIComponent(token)}`);
        const data = await response.json();
        setValidToken(Boolean(data.valid));
        if (!data.valid) {
          setError(data.message || 'This reset link is invalid or expired.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to validate reset token.');
        setValidToken(false);
      } finally {
        setValidating(false);
      }
    };

    validateToken();
  }, [token]);

  if (validating) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-sm text-slate-700 shadow-xl shadow-slate-200/50">
          <Loader2 size={18} className="animate-spin text-emerald-600" />
          Validating reset link...
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans">
        {/* Left decorative branding panel */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative z-10">
            <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-emerald-100 mb-4 border border-white/10 shadow-sm">
              Security Notice
            </span>
            <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-3">Link Validation Failed.</h1>
            <p className="text-emerald-100/90 text-sm xl:text-base max-w-sm leading-relaxed">
              For your security, password reset links have a limited lifespan and can only be used once.
            </p>
          </div>
          <div className="relative z-10 text-xs text-emerald-200/70 font-medium">
            &copy; {new Date().getFullYear()} All rights reserved. Secure encrypted authentication.
          </div>
        </div>

        {/* Right error container */}
        <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/80 p-8 text-center flex flex-col justify-center my-auto backdrop-blur-xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-inner">
              <ShieldAlert size={30} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invalid or Expired Link</h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">{error || 'This password reset link is no longer valid.'}</p>
            <div className="mt-6">
              <Link href="/forgot-password" className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all">
                Request a new reset link
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-sans">
      {/* Left decorative branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 text-white p-8 xl:p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative z-10">
          <span className="inline-block px-3 py-1 bg-white/15 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-emerald-100 mb-4 border border-white/10 shadow-sm">
            Password Recovery
          </span>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-3">Create a new password.</h1>
          <p className="text-emerald-100/90 text-sm xl:text-base max-w-sm leading-relaxed">
            Enter a secure new password for your account to regain full access to your workspace.
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
            <div className="mx-auto lg:mx-0 mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset Password</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Enter your new credentials below.
            </p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-sm text-slate-600 font-medium">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}