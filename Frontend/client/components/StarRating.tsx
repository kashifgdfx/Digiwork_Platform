'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  reviewCount,
  interactive = false,
  onChange,
  size = 'sm',
  showCount = true,
}) => {
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 20;
  const textSize = size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base';

  const [hovered, setHovered] = React.useState<number | null>(null);
  const displayRating = hovered ?? rating;
  return (
    <div className={`flex items-center gap-1 ${textSize}`} aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      <div className="flex items-center" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, displayRating - star + 1));
        return <button key={star} type="button" disabled={!interactive} onMouseEnter={() => interactive && setHovered(star)} onClick={() => interactive && onChange?.(star)} className={interactive ? 'cursor-pointer transition-transform hover:scale-110' : 'cursor-default'} aria-label={`${star} stars`}>
          <span className="relative block"><Star size={iconSize} className="text-amber-400" /><span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}><Star size={iconSize} className="fill-amber-400 text-amber-400" /></span></span>
        </button>;
      })}
      </div>
      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
      {showCount && reviewCount !== undefined && (
        <span className="text-gray-500">({reviewCount})</span>
      )}
    </div>
  );
};
