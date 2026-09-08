'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewCount,
  size = 'sm',
  showCount = true,
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  return (
    <div className={`flex items-center gap-1 ${textSize}`}>
      <Star
        size={iconSize}
        className="fill-amber-400 text-amber-400 inline-block"
      />
      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
      {showCount && reviewCount !== undefined && (
        <span className="text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
};
