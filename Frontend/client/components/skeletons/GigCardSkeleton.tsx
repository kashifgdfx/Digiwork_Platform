import React from 'react';
import { Skeleton } from './Skeleton';

export function GigCardSkeleton() {
  return (
    <div className="group flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <div className="relative overflow-hidden">
        <Skeleton height="h-48" rounded="rounded-none" className="w-full" />
      </div>

      <div className="p-4">
        <div className="mb-3 flex items-center gap-2.5">
          <Skeleton width="w-7" height="h-7" rounded="rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton width="w-20" height="h-3" />
            <Skeleton width="w-16" height="h-2.5" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton width="w-full" height="h-3" />
          <Skeleton width="w-11/12" height="h-3" />
          <Skeleton width="w-2/3" height="h-3" />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Skeleton width="w-20" height="h-3" />
          <Skeleton width="w-16" height="h-3" />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 bg-gray-50/60 px-4 py-3">
        <Skeleton width="w-16" height="h-2.5" />
        <Skeleton width="w-12" height="h-4" />
      </div>
    </div>
  );
}

export default GigCardSkeleton;
