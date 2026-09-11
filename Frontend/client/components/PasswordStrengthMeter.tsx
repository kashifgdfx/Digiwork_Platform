'use client';

import { Check, ShieldAlert, X } from 'lucide-react';
import { PasswordStrengthResult } from '@/types';

export function calculatePasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const validCount = Object.values(checks).filter(Boolean).length;

  let score = 0;
  let label: PasswordStrengthResult['label'] = 'Weak';
  let color = 'bg-red-500';
  let width = 0;

  if (validCount === 0) {
    label = 'Weak';
    color = 'bg-red-500';
    width = 20;
    score = 1;
  } else if (validCount <= 2) {
    label = 'Medium';
    color = 'bg-amber-500';
    width = 45;
    score = 2;
  } else if (validCount <= 3) {
    label = 'Strong';
    color = 'bg-blue-500';
    width = 75;
    score = 3;
  } else {
    label = 'Very Strong';
    color = 'bg-emerald-500';
    width = 100;
    score = 4;
  }

  return {
    score,
    label,
    color,
    width,
    valid: validCount === 5,
    checks,
  };
}

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const strength = calculatePasswordStrength(password);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium text-gray-600">
        <span>Password strength</span>
        <span className="font-semibold text-gray-800">{strength.label}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
          style={{ width: `${strength.width}%` }}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-2">
        {[
          { key: 'minLength', label: '8+ characters' },
          { key: 'uppercase', label: 'Uppercase letter' },
          { key: 'lowercase', label: 'Lowercase letter' },
          { key: 'number', label: 'Number' },
          { key: 'special', label: 'Special character' },
        ].map((item) => {
          const ok = strength.checks[item.key as keyof typeof strength.checks];
          return (
            <div key={item.key} className="flex items-center gap-2">
              {ok ? (
                <Check size={14} className="text-emerald-600" />
              ) : (
                <X size={14} className="text-gray-400" />
              )}
              <span className={ok ? 'text-gray-700' : 'text-gray-500'}>{item.label}</span>
            </div>
          );
        })}
      </div>
      {!password && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          <ShieldAlert size={14} />
          Choose a strong password to secure your account.
        </div>
      )}
    </div>
  );
}
