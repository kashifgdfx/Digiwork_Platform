import React from 'react';
import { Skeleton } from './Skeleton';

export function MessagesSkeleton() {
  return (
    <div className="mx-auto h-[calc(100vh-6rem)] min-h-[650px] max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-100">
        <div className="hidden w-96 flex-col border-r border-slate-100 bg-slate-50/60 md:flex">
          <div className="border-b border-slate-100 bg-white/80 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Skeleton width="w-9" height="h-9" rounded="rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton width="w-20" height="h-3.5" />
                  <Skeleton width="w-28" height="h-2.5" />
                </div>
              </div>
              <Skeleton width="w-16" height="h-6" rounded="rounded-full" />
            </div>
            <Skeleton height="h-10" rounded="rounded-xl" />
          </div>

          <div className="flex-1 space-y-3 p-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-2xl p-3">
                <Skeleton width="w-12" height="h-12" rounded="rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="w-28" height="h-3.5" />
                  <Skeleton width="w-40" height="h-2.5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-1 flex-col bg-white">
          <div className="flex items-center justify-between border-b border-slate-100 bg-white/80 px-6 py-4">
            <div className="flex items-center gap-3.5">
              <Skeleton width="w-11" height="h-11" rounded="rounded-2xl" />
              <div className="space-y-1.5">
                <Skeleton width="w-28" height="h-3.5" />
                <Skeleton width="w-36" height="h-2.5" />
              </div>
            </div>
            <Skeleton width="w-28" height="h-8" rounded="rounded-xl" />
          </div>

          <div className="flex-1 space-y-6 bg-slate-50/30 p-6">
            <div className="flex justify-center">
              <Skeleton width="w-64" height="h-7" rounded="rounded-full" />
            </div>
            {[1, 2, 3].map((item) => (
              <div key={item} className={item % 2 === 0 ? 'flex justify-end' : 'flex justify-start'}>
                <div className="space-y-2">
                  <Skeleton width={item % 2 === 0 ? 'w-64' : 'w-72'} height="h-12" rounded="rounded-2xl" />
                  <Skeleton width="w-16" height="h-2.5" />
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-slate-100 bg-white px-6 py-3">
            <Skeleton width="w-10" height="h-10" rounded="rounded-xl" />
            <Skeleton width="w-[60%]" height="h-11" rounded="rounded-xl" />
            <Skeleton width="w-24" height="h-11" rounded="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessagesSkeleton;
