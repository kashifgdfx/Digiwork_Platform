'use client';

import React, { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2, Trash2, X } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  /** Text for the confirm button. Default: "Confirm" */
  confirmLabel?: string;
  /** Text for the cancel button. Default: "Cancel" */
  cancelLabel?: string;
  /** Visual style of the confirm button. Default: "danger" */
  variant?: ConfirmVariant;
  /** Show a loading spinner on the confirm button while awaiting the action */
  loading?: boolean;
}

interface ConfirmDialogProps extends ConfirmDialogOptions {
  open: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// ─── Variant config ───────────────────────────────────────────────────────────

const variantConfig: Record<
  ConfirmVariant,
  {
    icon: React.ReactNode;
    iconBg: string;
    confirmBtn: string;
    confirmBtnHover: string;
    focusRing: string;
  }
> = {
  danger: {
    icon: <Trash2 size={24} className="text-red-600" aria-hidden="true" />,
    iconBg: 'bg-red-100',
    confirmBtn: 'bg-red-600 text-white',
    confirmBtnHover: 'hover:bg-red-700',
    focusRing: 'focus:ring-red-500',
  },
  warning: {
    icon: <AlertTriangle size={24} className="text-amber-500" aria-hidden="true" />,
    iconBg: 'bg-amber-100',
    confirmBtn: 'bg-amber-500 text-white',
    confirmBtnHover: 'hover:bg-amber-600',
    focusRing: 'focus:ring-amber-400',
  },
  info: {
    icon: <AlertTriangle size={24} className="text-blue-500" aria-hidden="true" />,
    iconBg: 'bg-blue-100',
    confirmBtn: 'bg-blue-600 text-white',
    confirmBtnHover: 'hover:bg-blue-700',
    focusRing: 'focus:ring-blue-500',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cfg = variantConfig[variant];
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the cancel button on open for safety (default-safe action)
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => cancelRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Trap focus within dialog and handle Escape
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === 'Tab') {
        const el = dialogRef.current;
        if (!el) return;
        const focusable = el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
      aria-modal="true"
      role="alertdialog"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        style={{ animation: 'fadeIn 0.2s ease' }}
        onClick={!loading ? onCancel : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl"
        style={{ animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
      >
        {/* Close button */}
        <button
          onClick={onCancel}
          disabled={loading}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:pointer-events-none"
        >
          <X size={16} />
        </button>

        <div className="p-7">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${cfg.iconBg}`}
            >
              {cfg.icon}
            </div>
            <div className="pt-0.5">
              <h2
                id="confirm-dialog-title"
                className="text-lg font-bold text-gray-900 leading-tight"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="mt-1.5 text-sm text-gray-500 leading-relaxed"
              >
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`
                w-full sm:w-auto px-5 py-2.5 rounded-xl text-sm font-bold transition
                focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60
                flex items-center justify-center gap-2
                ${cfg.confirmBtn} ${cfg.confirmBtnHover} ${cfg.focusRing}
              `}
            >
              {loading && <Loader2 size={15} className="animate-spin" aria-hidden="true" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>

      {/* Keyframe styles injected inline so they work without a separate CSS file */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
