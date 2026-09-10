import React from 'react';
import { Skeleton } from './Skeleton';

export function ReviewsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <Skeleton width="w-40" height="h-6" />
        <div className="mt-4 flex items-center gap-3">
          <Skeleton width="w-24" height="h-4" />
          <Skeleton width="w-32" height="h-4" />
        </div>
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((review) => (
          <div key={review} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton width="w-11" height="h-11" rounded="rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton width="w-28" height="h-3.5" />
                  <Skeleton width="w-20" height="h-3" />
                </div>
              </div>
              <Skeleton width="w-16" height="h-3.5" />
            </div>
            <div className="mt-3">
              <Skeleton width="w-32" height="h-4" />
            </div>
            <div className="mt-4 space-y-2">
              <Skeleton width="w-full" height="h-3" />
              <Skeleton width="w-full" height="h-3" />
              <Skeleton width="w-4/5" height="h-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ReviewsSkeleton;
