'use client';

import React from 'react';
import { mockCategories } from '@/data/mockData';
import { Filter, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  selectedCategory: string;
  onCategoryChange: (cat: string) => void;
  minPrice: number | '';
  maxPrice: number | '';
  onPriceChange: (min: number | '', max: number | '') => void;
  deliveryDays: number | null;
  onDeliveryChange: (days: number | null) => void;
  sellerLevel: string;
  onSellerLevelChange: (level: string) => void;
  onReset: () => void;
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  deliveryDays,
  onDeliveryChange,
  sellerLevel,
  onSellerLevelChange,
  onReset,
}) => {
  const sellerLevels = ['All', 'Top Rated Seller', 'Level 2', 'Level 1'];
  const deliveryOptions = [
    { label: 'Any Delivery Time', value: null },
    { label: 'Express 24 Hours', value: 1 },
    { label: 'Up to 3 Days', value: 3 },
    { label: 'Up to 7 Days', value: 7 },
  ];

  return (
    <aside className="w-full lg:w-64 bg-white border border-gray-200 rounded-xl p-5 space-y-6 h-fit sticky top-20 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 font-bold text-gray-900 text-base">
          <Filter size={18} className="text-[#1dbf73]" />
          <span>Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-gray-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
          title="Reset all filters"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Category Filter */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Category
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onCategoryChange('')}
            className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
              !selectedCategory
                ? 'bg-emerald-50 text-[#1dbf73] font-bold'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All Categories
          </button>
          {mockCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.name)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs transition-colors flex items-center justify-between ${
                selectedCategory === cat.name
                  ? 'bg-emerald-50 text-[#1dbf73] font-bold'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              <span className="text-[10px] text-gray-400 ml-1">({cat.gigCount})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Budget Filter */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Budget ($ USD)
        </h4>
        <div className="flex items-center gap-2 mb-3">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) =>
              onPriceChange(e.target.value === '' ? '' : Number(e.target.value), maxPrice)
            }
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#1dbf73]"
            min={0}
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) =>
              onPriceChange(minPrice, e.target.value === '' ? '' : Number(e.target.value))
            }
            className="w-full px-2.5 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:border-[#1dbf73]"
            min={0}
          />
        </div>

        {/* Quick Budget Presets */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => onPriceChange('', 50)}
            className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            Under $50
          </button>
          <button
            onClick={() => onPriceChange(50, 150)}
            className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            $50 - $150
          </button>
          <button
            onClick={() => onPriceChange(150, '')}
            className="px-2 py-1 text-[11px] bg-gray-100 hover:bg-gray-200 text-gray-700 rounded transition-colors"
          >
            $150 & Above
          </button>
        </div>
      </div>

      {/* Delivery Time */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Delivery Time
        </h4>
        <div className="space-y-2">
          {deliveryOptions.map((opt, i) => (
            <label
              key={i}
              className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none hover:text-gray-900"
            >
              <input
                type="radio"
                name="delivery"
                checked={deliveryDays === opt.value}
                onChange={() => onDeliveryChange(opt.value)}
                className="w-3.5 h-3.5 text-[#1dbf73] focus:ring-[#1dbf73] accent-[#1dbf73]"
              />
              <span>{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Seller Level */}
      <div className="pt-2 border-t border-gray-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
          Seller Level
        </h4>
        <div className="space-y-2">
          {sellerLevels.map((lvl) => (
            <label
              key={lvl}
              className="flex items-center gap-2.5 text-xs text-gray-700 cursor-pointer select-none hover:text-gray-900"
            >
              <input
                type="radio"
                name="sellerLevel"
                checked={(sellerLevel === '' && lvl === 'All') || sellerLevel === lvl}
                onChange={() => onSellerLevelChange(lvl === 'All' ? '' : lvl)}
                className="w-3.5 h-3.5 text-[#1dbf73] focus:ring-[#1dbf73] accent-[#1dbf73]"
              />
              <span>{lvl}</span>
            </label>
          ))}
        </div>
      </div>
    </aside>
  );
};
