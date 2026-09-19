'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import type { ToastItem, ToastVariant } from '@/context/ToastContext';

// ─── Variant config ───────────────────────────────────────────────────────────

const configs: Record<
  ToastVariant,
  {
    icon: React.ReactNode;
    bg: string;
    border: string;
    titleColor: string;
    msgColor: string;
    iconBg: string;
    progressColor: string;
    closeHover: string;
  }
> = {
  success: {
    icon: <CheckCircle2 size={20} className="text-emerald-600" aria-hidden="true" />,
    bg: 'bg-white',
    border: 'border-emerald-200',
    titleColor: 'text-emerald-900',
    msgColor: 'text-emerald-700',
    iconBg: 'bg-emerald-50',
    progressColor: 'bg-emerald-500',
    closeHover: 'hover:bg-emerald-50 text-emerald-400 hover:text-emerald-700',
  },
  error: {
    icon: <AlertCircle size={20} className="text-red-600" aria-hidden="true" />,
    bg: 'bg-white',
    border: 'border-red-200',
    titleColor: 'text-red-900',
    msgColor: 'text-red-700',
    iconBg: 'bg-red-50',
    progressColor: 'bg-red-500',
    closeHover: 'hover:bg-red-50 text-red-400 hover:text-red-700',
  },
  warning: {
    icon: <AlertTriangle size={20} className="text-amber-500" aria-hidden="true" />,
    bg: 'bg-white',
    border: 'border-amber-200',
    titleColor: 'text-amber-900',
    msgColor: 'text-amber-700',
    iconBg: 'bg-amber-50',
    progressColor: 'bg-amber-400',
    closeHover: 'hover:bg-amber-50 text-amber-400 hover:text-amber-700',
  },
  info: {
    icon: <Info size={20} className="text-blue-600" aria-hidden="true" />,
    bg: 'bg-white',
    border: 'border-blue-200',
    titleColor: 'text-blue-900',
    msgColor: 'text-blue-700',
    iconBg: 'bg-blue-50',
    progressColor: 'bg-blue-500',
    closeHover: 'hover:bg-blue-50 text-blue-400 hover:text-blue-700',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  item: ToastItem;
  onDismiss: (id: string) => void;
}

export default function Toast({ item, onDismiss }: Props) {
  const cfg = configs[item.variant];
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const animFrame = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  const duration = item.duration && item.duration > 0 ? item.duration : 0;

  // Entry animation
  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Progress bar animation
  useEffect(() => {
    if (!duration) return;
    startTime.current = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime.current;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining > 0) {
        animFrame.current = requestAnimationFrame(tick);
      }
    };
    animFrame.current = requestAnimationFrame(tick);
    return () => {
      if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
    };
  }, [duration]);

  const handleDismiss = () => {
    if (animFrame.current !== null) cancelAnimationFrame(animFrame.current);
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 300);
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.96)',
        opacity: visible && !exiting ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
        pointerEvents: 'all',
      }}
      className={`
        relative w-full rounded-2xl border shadow-xl overflow-hidden
        ${cfg.bg} ${cfg.border}
      `}
    >
      <div className="flex items-start gap-3 px-4 pt-4 pb-3.5">
        {/* Icon */}
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${cfg.iconBg}`}>
          {cfg.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          {item.title && (
            <p className={`text-sm font-bold leading-tight mb-0.5 ${cfg.titleColor}`}>
              {item.title}
            </p>
          )}
          <p className={`text-sm leading-snug ${item.title ? cfg.msgColor : cfg.titleColor}`}>
            {item.message}
          </p>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notification"
          className={`
            flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center
            transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-300
            ${cfg.closeHover}
          `}
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      {duration > 0 && (
        <div className="h-0.5 w-full bg-gray-100">
          <div
            className={`h-full transition-none ${cfg.progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
