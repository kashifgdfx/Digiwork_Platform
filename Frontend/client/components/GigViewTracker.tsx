'use client';

import { useEffect } from 'react';
import { trackGigView } from '@/lib/api';

interface GigViewTrackerProps {
  gigId: string;
  sellerId?: string;
}

/**
 * Fires a single gig-view beacon when a gig page is opened.
 * Deduplication (same visitor + gig within 30 min) is enforced server-side,
 * but we also guard against React double-mounts in dev/strict mode.
 */
export const GigViewTracker: React.FC<GigViewTrackerProps> = ({ gigId, sellerId }) => {
  useEffect(() => {
    if (!gigId) return;
    let cancelled = false;

    const storageKey = `gig-view:${gigId}`;
    const last = typeof window !== 'undefined' ? Number(window.localStorage.getItem(storageKey) || 0) : 0;
    const withinWindow = Date.now() - last < 30 * 60 * 1000;

    if (!withinWindow && !cancelled) {
      trackGigView({
        gigId,
        sellerId,
        country: typeof navigator !== 'undefined' ? (navigator.language || '').split('-')[1] || '' : '',
        device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
        browser: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : '',
      }).catch(() => undefined);
      try {
        window.localStorage.setItem(storageKey, String(Date.now()));
      } catch {
        /* ignore storage errors */
      }
    }

    return () => {
      cancelled = true;
    };
  }, [gigId, sellerId]);

  return null;
};

export default GigViewTracker;