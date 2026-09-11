'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';

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
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm text-gray-700 shadow-sm">
          <Loader2 size={16} className="animate-spin" />
          Validating reset link...
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <ShieldAlert size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900">Invalid or Expired Link</h1>
          <p className="mt-3 text-sm text-gray-600">{error || 'This password reset link is no longer valid.'}</p>
          <Link href="/forgot-password" className="mt-6 inline-flex rounded-xl bg-[#1dbf73] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#19a463]">
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={26} />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900">Reset Password</h1>
            <p className="mt-2 text-sm text-gray-600">Create a new password for your account.</p>
          </div>
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-gray-600">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
