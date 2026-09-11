'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
  autoComplete?: string;
  disabled?: boolean;
}

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder = 'Password',
  required = false,
  name,
  autoComplete,
  disabled = false,
}: PasswordInputProps) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          name={name}
          autoComplete={autoComplete}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="block w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 shadow-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-gray-100"
        />
        <button
          type="button"
          onClick={() => setShow((current) => !current)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 transition hover:text-emerald-600"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
}
