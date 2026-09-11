'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordRequirements } from '@/components/PasswordRequirements';
import { PasswordStrengthMeter, calculatePasswordStrength } from '@/components/PasswordStrengthMeter';
import { ResetPasswordPayload } from '@/types';

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState('');

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const isMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const canSubmit = strength.valid && isMatch && !loading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError('');
    setSuccess('');

    if (!token) {
      setSubmitError('Reset token is missing.');
      return;
    }

    if (!strength.valid) {
      setSubmitError('Password does not meet the required strength rules.');
      return;
    }

    if (!isMatch) {
      setSubmitError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const payload: ResetPasswordPayload = {
        token,
        password,
        confirmPassword,
      };

      const response = await apiFetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Unable to update password.');
      }

      setSuccess(data.message || 'Password updated successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PasswordInput
        label="New Password"
        value={password}
        onChange={setPassword}
        placeholder="Enter a strong password"
        autoComplete="new-password"
      />

      <PasswordStrengthMeter password={password} />
      <PasswordRequirements password={password} />

      <div>
        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter password"
          autoComplete="new-password"
        />
        {confirmPassword && (
          <div className={`mt-2 text-sm ${isMatch ? 'text-emerald-600' : 'text-red-600'}`}>
            {isMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
          </div>
        )}
      </div>

      {submitError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 size={16} />
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center rounded-xl bg-[#1dbf73] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#19a463] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="mr-2 animate-spin" />
            Updating password...
          </>
        ) : (
          <>
            <ShieldCheck size={16} className="mr-2" />
            Update Password
          </>
        )}
      </button>
    </form>
  );
}
