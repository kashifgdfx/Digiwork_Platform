import React from 'react';
import { Skeleton } from './Skeleton';

export function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm">
          <Skeleton width="w-12" height="h-12" rounded="rounded-2xl" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Skeleton width="w-28" height="h-3.5" />
              <Skeleton width="w-12" height="h-2.5" />
            </div>
            <Skeleton width="w-40" height="h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default ConversationListSkeleton;
