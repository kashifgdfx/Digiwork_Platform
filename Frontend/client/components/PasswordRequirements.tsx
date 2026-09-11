'use client';

import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const checks = [
    { label: 'At least 8 characters', ok: password.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
    { label: 'One number', ok: /\d/.test(password) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
        Password requirements
      </p>
      <div className="space-y-2 text-sm">
        {checks.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-gray-700">
            {item.ok ? (
              <Check size={14} className="text-emerald-600" />
            ) : (
              <X size={14} className="text-gray-400" />
            )}
            <span className={item.ok ? 'text-emerald-700' : 'text-gray-500'}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
