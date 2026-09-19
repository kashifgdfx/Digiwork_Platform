'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useId,
  useReducer,
  useRef,
  useState,
} from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  /** Duration in ms. 0 = never auto-dismiss. Default: 4500 */
  duration?: number;
}

interface ToastContextValue {
  toast: (opts: Omit<ToastItem, 'id'>) => string;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null);

// ─── Reducer ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'ADD'; item: ToastItem }
  | { type: 'REMOVE'; id: string }
  | { type: 'CLEAR' };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case 'ADD':
      // Keep at most 5 toasts, newest at top
      return [action.item, ...state].slice(0, 5);
    case 'REMOVE':
      return state.filter((t) => t.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

let counter = 0;
function genId() {
  return `toast-${Date.now()}-${++counter}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // 🔊 Notification Sound Play Function
const playSound = () => {
    try {
      const audio = new Audio('/beep.wav');
      audio.play()
        .then(() => {
          console.log('Custom beep.wav played successfully!');
        })
        .catch((err) => {
          console.log('Audio play blocked or failed:', err);
        });
    } catch (e) {
      console.error('Sound play error:', e);
    }
  };

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id]);
    delete timers.current[id];
    dispatch({ type: 'REMOVE', id });
  }, []);

  const dismissAll = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    dispatch({ type: 'CLEAR' });
  }, []);

  const toast = useCallback(
    (opts: Omit<ToastItem, 'id'>): string => {
      const id = genId();
      const duration = opts.duration !== undefined ? opts.duration : 4500;
      
      // 🔔 Jaise hi koi toast trigger hoga, sound baj jayegi
      playSound();

      dispatch({ type: 'ADD', item: { ...opts, id, duration } });
      if (duration > 0) {
        timers.current[id] = setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const success = useCallback(
    (message: string, title?: string) => toast({ variant: 'success', message, title }),
    [toast],
  );
  const error = useCallback(
    (message: string, title?: string) => toast({ variant: 'error', message, title, duration: 6000 }),
    [toast],
  );
  const warning = useCallback(
    (message: string, title?: string) => toast({ variant: 'warning', message, title }),
    [toast],
  );
  const info = useCallback(
    (message: string, title?: string) => toast({ variant: 'info', message, title }),
    [toast],
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss, dismissAll }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

// ─── Viewport (renders toasts) ────────────────────────────────────────────────

import ToastComponent from '@/components/ui/Toast';

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-5 right-5 z-[99999] flex flex-col gap-3 w-full max-w-sm pointer-events-none"
    >
      {toasts.map((t) => (
        <ToastComponent key={t.id} item={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}