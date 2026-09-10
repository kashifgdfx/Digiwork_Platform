import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded-xl',
  className = '',
}: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={[
        'relative isolate overflow-hidden bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse',
        width,
        height,
        rounded,
        'before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent',
        className,
      ].join(' ')}
    />
  );
}

export default Skeleton;
