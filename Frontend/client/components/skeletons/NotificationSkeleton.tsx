import React from 'react';
import { Skeleton } from './Skeleton';

export function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div key={item} className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton width="w-32" height="h-3.5" />
            <Skeleton width="w-full" height="h-3" />
            <Skeleton width="w-2/3" height="h-3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default NotificationSkeleton;
