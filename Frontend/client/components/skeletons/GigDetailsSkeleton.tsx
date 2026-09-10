import React from 'react';
import { Skeleton } from './Skeleton';

export function GigDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-2">
        <Skeleton width="w-16" height="h-3" />
        <Skeleton width="w-3" height="h-3" />
        <Skeleton width="w-24" height="h-3" />
        <Skeleton width="w-3" height="h-3" />
        <Skeleton width="w-28" height="h-3" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="space-y-8 lg:col-span-7 xl:col-span-8">
          <div className="space-y-4">
            <Skeleton width="w-3/4" height="h-10" rounded="rounded-lg" />
            <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2.5">
                <Skeleton width="w-10" height="h-10" rounded="rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton width="w-24" height="h-3.5" />
                  <Skeleton width="w-16" height="h-3" />
                </div>
              </div>
              <Skeleton width="w-20" height="h-7" rounded="rounded-full" />
              <Skeleton width="w-24" height="h-4" />
            </div>
          </div>

          <div className="space-y-3">
            <Skeleton height="h-[420px]" rounded="rounded-2xl" />
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((item) => (
                <Skeleton key={item} width="w-20" height="h-14" rounded="rounded-lg" />
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6">
            <Skeleton width="w-40" height="h-6" />
            <div className="space-y-2">
              <Skeleton width="w-full" height="h-3" />
              <Skeleton width="w-full" height="h-3" />
              <Skeleton width="w-11/12" height="h-3" />
              <Skeleton width="w-full" height="h-3" />
              <Skeleton width="w-4/5" height="h-3" />
            </div>
          </div>

          <div className="space-y-4 border-t border-gray-100 pt-6">
            <Skeleton width="w-52" height="h-6" />
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="rounded-xl border border-gray-200 p-4">
                  <Skeleton width="w-3/4" height="h-4" />
                  <div className="mt-3 space-y-2">
                    <Skeleton width="w-full" height="h-3" />
                    <Skeleton width="w-2/3" height="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 xl:col-span-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50">
              {[1, 2, 3].map((item) => (
                <Skeleton key={item} height="h-14" rounded="rounded-none" className="border-r border-gray-100 last:border-r-0" />
              ))}
            </div>
            <div className="space-y-6 p-6">
              <div className="flex items-center justify-between">
                <Skeleton width="w-24" height="h-3" />
                <Skeleton width="w-12" height="h-8" />
              </div>
              <div className="space-y-2">
                <Skeleton width="w-2/3" height="h-4" />
                <Skeleton width="w-full" height="h-3" />
                <Skeleton width="w-4/5" height="h-3" />
              </div>
              <div className="flex items-center gap-6 border-t border-gray-100 pt-3">
                <Skeleton width="w-24" height="h-4" />
                <Skeleton width="w-24" height="h-4" />
              </div>
              <div className="space-y-2.5">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <Skeleton width="w-4" height="h-4" rounded="rounded-full" />
                    <Skeleton width="w-40" height="h-3" />
                  </div>
                ))}
              </div>
              <div className="space-y-3 border-t border-gray-100 pt-4">
                <Skeleton height="h-11" rounded="rounded-xl" />
                <Skeleton height="h-10" rounded="rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GigDetailsSkeleton;
