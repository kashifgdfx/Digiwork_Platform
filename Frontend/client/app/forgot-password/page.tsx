'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, Mail } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/context/ToastContext';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      const response = await apiFetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to send reset link.');
      }

      toastSuccess('Password reset link has been sent to your email.', 'Check your inbox');
      setEmail('');
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Unable to send reset link.');
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
            Account Recovery
          </span>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-3">Forgot your password?</h1>
          <p className="text-emerald-100/90 text-sm xl:text-base max-w-sm leading-relaxed">
            No worries! Enter your registered email address and we&apos;ll send you a secure link to reset your password.
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
              <Mail size={24} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reset your password</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50 hover:bg-white"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Sending reset link...
                  </>
                ) : (
                  'Send Reset Link'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-xs sm:text-sm text-slate-500">
            Remember your password?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}