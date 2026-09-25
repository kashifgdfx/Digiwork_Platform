'use client';

import React from 'react';
import Link from 'next/link';
import { Gig } from '@/types';
import { useApp } from '@/context/AppContext';
import { StarRating } from './StarRating';
import { Heart } from 'lucide-react';

interface GigCardProps {
  gig: Gig;
}

export const GigCard: React.FC<GigCardProps> = ({ gig }) => {
  const { toggleFavorite, isFavorite } = useApp();
  const favorited = isFavorite(gig.id);
  const seller = gig?.seller || {
    name: 'Unknown Seller',
    avatar: '',
    level: 'New Seller',
  };
  const fallbackImage = 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80';

  return (
    <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
      <div>
        {/* Thumbnail & Favorite Toggle */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <Link href={`/gigs/${gig.id}`}>
            <img
              src={gig.images?.[0] || fallbackImage}
              alt={gig.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleFavorite(gig.id);
            }}
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all ${
              favorited
                ? 'bg-rose-50 text-rose-600 scale-110'
                : 'bg-black/30 hover:bg-black/50 text-white'
            }`}
            title={favorited ? 'Remove from saved' : 'Save to favorites'}
            aria-label="Favorite"
          >
            <Heart
              size={16}
              className={`transition-colors ${favorited ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </button>

          {gig.isFeatured && (
            <span className="absolute top-2.5 left-2.5 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs uppercase tracking-wider">
              Featured
            </span>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Seller Meta */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <img
              src={seller.avatar || fallbackImage}
              alt={seller.name}
              className="w-7 h-7 rounded-full object-cover border border-gray-100"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-gray-900 truncate">
                {seller.name}
              </span>
              <span className="text-[11px] text-gray-500 truncate">
                {seller.level}
              </span>
            </div>
          </div>

          {/* Title */}
          <Link href={`/gigs/${gig.id}`}>
            <h3 className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-[#1dbf73] transition-colors leading-snug mb-3">
              {gig.title}
            </h3>
          </Link>

          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <StarRating rating={gig.rating} reviewCount={gig.reviewCount} size="sm" />
          </div>
        </div>
      </div>

      {/* Footer / Price */}
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
          Starting at
        </span>
        <span className="text-base font-bold text-gray-900">
         ₹ {gig.startingPrice}
        </span>
      </div>
    </div>
  );
};
