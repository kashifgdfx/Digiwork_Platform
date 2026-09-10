import React from 'react';
import { Skeleton } from './Skeleton';

export function SearchResultsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton width="w-64" height="h-7" />
          <Skeleton width="w-40" height="h-3.5" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton width="w-28" height="h-9" rounded="rounded-lg" />
          <Skeleton width="w-28" height="h-9" rounded="rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="hidden w-full max-w-xs lg:block">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <Skeleton width="w-32" height="h-5" />
            <div className="mt-5 space-y-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="space-y-2">
                  <Skeleton width="w-28" height="h-3.5" />
                  <Skeleton width="w-full" height="h-9" rounded="rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1">
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
                <Skeleton height="h-48" rounded="rounded-none" />
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
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <Skeleton width="w-16" height="h-2.5" />
                    <Skeleton width="w-12" height="h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SearchResultsSkeleton;
