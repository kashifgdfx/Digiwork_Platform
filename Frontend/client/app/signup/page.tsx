'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
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

    // Client-side guards (button should already be disabled, but double-check)
    if (!strength.valid) {
      toastError('Password does not meet the required strength rules.');
      return;
    }
    if (!passwordsMatch) {
      toastError('Passwords do not match.');
      return;
    }

    setLoading(true);
    console.log('[Signup] Submitting to POST /api/auth/signup …');

    try {
      // Step 1: Create the account
      const signupRes = await apiFetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), username: username.trim(), email: email.trim(), password }),
      });

      const signupData = await signupRes.json();
      console.log('[Signup] Response:', signupRes.status, signupData);

      if (!signupRes.ok) {
        throw new Error(signupData.error || 'Signup failed. Please try again.');
      }

      // Step 2: Auto-login immediately after account creation
      console.log('[Signup] Account created — auto-logging in …');
      const loginRes = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const loginData = await loginRes.json();
      console.log('[Signup] Auto-login response:', loginRes.status, loginData);

      if (!loginRes.ok) {
        // Account was created but auto-login failed — send to login page
        toastSuccess('Account created! Please sign in.');
        setTimeout(() => router.push('/login'), 1500);
        return;
      }

      // Step 3: Load the session into context
      const user = await refreshCurrentUser();
      console.log('[Signup] Session loaded:', user?.id);

      toastSuccess(`Welcome, ${signupData.user?.name || name}!`);
      setTimeout(() => router.replace('/'), 800);
    } catch (err: any) {
      console.error('[Signup] Error:', err);
      toastError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-green-600 hover:text-green-500">
            Sign in
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSignup}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Username</label>
              <div className="mt-1">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="johndoe_dev"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <div className="mt-1">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <PasswordInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="Create a strong password"
              name="password"
              autoComplete="new-password"
              required
            />

            <PasswordStrengthMeter password={password} />
            <PasswordRequirements password={password} />

            <PasswordInput
              label="Confirm Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Re-enter password"
              name="confirmPassword"
              autoComplete="new-password"
              required
            />

            {confirmPassword && (
              <div className={`text-sm font-medium ${passwordsMatch ? 'text-emerald-600' : 'text-red-600'}`}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </div>
            )}

            {/* Debug hint — remove in production */}
            {!isFormValid && (name || email || password) && (
              <p className="text-xs text-gray-400">
                {!strength.valid && 'Password must meet all 5 requirements. '}
                {strength.valid && !passwordsMatch && 'Passwords must match. '}
                {!name.trim() && 'Name required. '}
                {!username.trim() && 'Username required. '}
                {!email.trim() && 'Email required. '}
              </p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
