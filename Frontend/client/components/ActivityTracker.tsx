'use client';

import { useEffect } from 'react';

export function ActivityTracker({ gigId }: { gigId?: string }) {
  useEffect(() => {
    if (!gigId) return;

    let mouseMoves = 0;
    let keyPresses = 0;
    let clicks = 0;
    let lastMouseMoveAt = 0;

    const handleMouseMove = () => {
      // Count genuine movement without sending thousands of events per second.
      const now = Date.now();
      if (now - lastMouseMoveAt < 50) return;
      lastMouseMoveAt = now;
      mouseMoves++;
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      keyPresses++;
    };
    const handleClick = () => { clicks++; };

    const activityStorageKey = 'analytics-visitor-id';
    let visitorId = window.localStorage.getItem(activityStorageKey);
    if (!visitorId) {
      visitorId = crypto.randomUUID();
      window.localStorage.setItem(activityStorageKey, visitorId);
    }

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);

    const flushActivity = async () => {
      if (document.visibilityState !== 'visible' && mouseMoves === 0 && keyPresses === 0 && clicks === 0) return;
      const batch = { mouseMoves, keyPresses, clicks };
      if (batch.mouseMoves === 0 && batch.keyPresses === 0 && batch.clicks === 0) return;

      // Reset before the request, so interactions made during a slow request are
      // collected in the next batch rather than dropped.
      mouseMoves = 0;
      keyPresses = 0;
      clicks = 0;

      try {
        const response = await fetch('/api/analytics/track-activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          body: JSON.stringify({
            gigId,
            visitorId,
            ...batch,
          }),
        });
        if (!response.ok) {
          // Restore the unsaved batch for the next interval when possible.
          mouseMoves += batch.mouseMoves;
          keyPresses += batch.keyPresses;
          clicks += batch.clicks;
        }
      } catch {
        mouseMoves += batch.mouseMoves;
        keyPresses += batch.keyPresses;
        clicks += batch.clicks;
      }
    };

    // Send compact batches every 10 seconds and once more when the visitor leaves.
    const interval = window.setInterval(() => {
      void flushActivity();
    }, 10000);
    const handlePageHide = () => {
      void flushActivity();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      void flushActivity();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('pagehide', handlePageHide);
      window.clearInterval(interval);
    };
  }, [gigId]);

  return null;
}
