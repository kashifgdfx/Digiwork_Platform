import React from 'react';
import { Skeleton } from './Skeleton';

export function BuyerDashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-4">
          <Skeleton width="w-14" height="h-14" rounded="rounded-full" />
          <div className="space-y-2">
            <Skeleton width="w-28" height="h-4" />
            <Skeleton width="w-72" height="h-6" />
            <Skeleton width="w-56" height="h-3.5" />
          </div>
        </div>
        <Skeleton width="w-36" height="h-11" rounded="rounded-xl" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex items-center gap-4">
              <Skeleton width="w-12" height="h-12" rounded="rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-16" height="h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div key={item} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <Skeleton width="w-24" height="h-20" rounded="rounded-xl" />
                <div className="space-y-2">
                  <Skeleton width="w-52" height="h-4" />
                  <Skeleton width="w-36" height="h-3.5" />
                  <Skeleton width="w-28" height="h-3" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton width="w-24" height="h-7" rounded="rounded-full" />
                <Skeleton width="w-24" height="h-9" rounded="rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BuyerDashboardSkeleton;
