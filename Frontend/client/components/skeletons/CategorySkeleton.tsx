import React from 'react';
import { Skeleton } from './Skeleton';

export function CategorySkeleton() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton width="w-52" height="h-7" />
          <Skeleton width="w-72" height="h-3.5" />
        </div>
        <Skeleton width="w-28" height="h-4" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <Skeleton height="h-52" rounded="rounded-none" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default CategorySkeleton;
