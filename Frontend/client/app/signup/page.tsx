'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch, setAuthToken } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { PasswordInput } from '@/components/PasswordInput';
import { PasswordStrengthMeter, calculatePasswordStrength } from '@/components/PasswordStrengthMeter';
import { PasswordRequirements } from '@/components/PasswordRequirements';

export default function SignupPage() {
  const router = useRouter();
  const { refreshCurrentUser } = useApp();
  const { error: toastError, success: toastSuccess } = useToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const passwordsMatch = Boolean(password && confirmPassword && password === confirmPassword);
  const isFormValid = strength.valid && passwordsMatch && name.trim() && username.trim() && email.trim();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!strength.valid) {
      toastError('Password does not meet the required strength rules.');
      return;
    }
    if (!passwordsMatch) {
      toastError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const signupRes = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), email: email.trim(), password }),
      });

      const signupData = await signupRes.json();
      if (!signupRes.ok) {
        throw new Error(signupData.error || 'Signup failed. Please try again.');
      }

      setAuthToken(signupData.token || null);
      const user = await refreshCurrentUser();
      if (!user) {
        throw new Error('Your account was created, but the session could not be loaded. Please sign in.');
      }

      toastSuccess(`Welcome, ${signupData.user?.name || name}!`);
      router.replace('/dashboard/buyer');
    } catch (err: any) {
      toastError(err.message || 'An unexpected error occurred. Please try again.');
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
          <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium uppercase tracking-wider text-emerald-100 mb-4 border border-white/10 shadow-sm">
            Secure Platform
          </span>
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight leading-tight mb-3">Join our growing community.</h1>
          <p className="text-emerald-100/90 text-sm xl:text-base max-w-sm leading-relaxed">
            Create your account in seconds and unlock full access to all your personalized tools and workflows.
          </p>
        </div>

        <div className="relative z-10 text-xs text-emerald-200/70 font-medium">
          &copy; {new Date().getFullYear()} All rights reserved. Secure encrypted authentication.
        </div>
      </div>

      {/* Right form container structured to fit inside 100vh with zero overflow */}
      <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100/80 p-6 sm:p-8 flex flex-col justify-center my-auto backdrop-blur-xl">
          <div className="mb-4 text-center lg:text-left">
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create an account</h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-500">
              Already have an account?{' '}
              <Link href="/login" className="font-semibold text-emerald-600 hover:text-emerald-500 transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <form className="space-y-3" onSubmit={handleSignup}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50 hover:bg-white"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all bg-slate-50/50 hover:bg-white"
                  placeholder="johndoe_dev"
                />
              </div>
            </div>

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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  placeholder="Password"
                  name="password"
                  autoComplete="new-password"
                  required
                />
              </div>
              <div>
                <PasswordInput
                  label="Confirm Password"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  placeholder="Confirm"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                />
              </div>
            </div>

            {/* Premium structural meter & requirements box */}
            <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-100 space-y-1">
              <div className="transform scale-95 origin-left">
                <PasswordStrengthMeter password={password} />
              </div>
              <div className="text-[11px] text-slate-500 grid grid-cols-2 gap-x-3 gap-y-1 pt-1 font-medium">
                <span className={password.length >= 8 ? 'text-emerald-600' : 'text-slate-400'}>• 8+ characters</span>
                <span className={/[A-Z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}>• Uppercase letter</span>
                <span className={/[a-z]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}>• Lowercase letter</span>
                <span className={/[0-9]/.test(password) ? 'text-emerald-600' : 'text-slate-400'}>• Number included</span>
              </div>
            </div>

            {confirmPassword && (
              <div className={`text-xs font-medium px-1 ${passwordsMatch ? 'text-emerald-600' : 'text-rose-600'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            {!isFormValid && (name || email || password) && (
              <p className="text-[11px] text-amber-600 font-medium px-1 leading-relaxed">
                {!strength.valid && '• Password requirements missing. '}
                {strength.valid && !passwordsMatch && '• Passwords must match. '}
                {!name.trim() && '• Name required. '}
                {!username.trim() && '• Username required. '}
                {!email.trim() && '• Email required. '}
              </p>
            )}

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-lg shadow-emerald-600/20 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creating account…' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
