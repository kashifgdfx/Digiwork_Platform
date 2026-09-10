import React from 'react';
import { Skeleton } from './Skeleton';

export function ProfileSkeleton() {
  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <Skeleton width="w-28" height="h-28" rounded="rounded-full" className="ring-4 ring-emerald-50" />
            <div className="min-w-0 flex-1 space-y-3">
              <Skeleton width="w-32" height="h-4" />
              <Skeleton width="w-52" height="h-9" />
              <Skeleton width="w-28" height="h-4" />
              <Skeleton width="w-72" height="h-5" />
              <div className="flex flex-wrap gap-4">
                <Skeleton width="w-28" height="h-4" />
                <Skeleton width="w-36" height="h-4" />
              </div>
            </div>
            <Skeleton width="w-28" height="h-20" rounded="rounded-xl" />
          </div>
          <div className="mt-7 max-w-3xl space-y-2">
            <Skeleton width="w-full" height="h-3.5" />
            <Skeleton width="w-full" height="h-3.5" />
            <Skeleton width="w-4/5" height="h-3.5" />
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {[1, 2, 3, 4].map((section) => (
              <section key={section} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <Skeleton width="w-32" height="h-6" />
                <div className="mt-4 space-y-3">
                  {[1, 2, 3].map((row) => (
                    <Skeleton key={row} width={row === 3 ? 'w-2/3' : 'w-full'} height="h-4" />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <Skeleton width="w-36" height="h-5" />
              <div className="mt-4 space-y-3">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex items-center justify-between">
                    <Skeleton width="w-24" height="h-3.5" />
                    <Skeleton width="w-16" height="h-3.5" />
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default ProfileSkeleton;
