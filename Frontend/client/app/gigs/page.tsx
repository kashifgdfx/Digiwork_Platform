'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { GigCard } from '@/components/GigCard';
import { FilterSidebar } from '@/components/FilterSidebar';
import { ArrowUpDown, Heart, Search, SlidersHorizontal, X } from 'lucide-react';

function GigsContent() {
  const searchParams = useSearchParams();
  const { gigs, favorites } = useApp();

  const urlCategory = searchParams.get('category') || '';
  const urlSearch = searchParams.get('search') || '';
  const isFavoritesOnly = searchParams.get('favorites') === 'true';

  const [selectedCategory, setSelectedCategory] = useState<string>(urlCategory);
  const [searchTerm, setSearchTerm] = useState<string>(urlSearch);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [deliveryDays, setDeliveryDays] = useState<number | null>(null);
  const [sellerLevel, setSellerLevel] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('recommended');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Sync state if url changes
  React.useEffect(() => {
    if (urlCategory) setSelectedCategory(urlCategory);
  }, [urlCategory]);

  React.useEffect(() => {
    if (urlSearch) setSearchTerm(urlSearch);
  }, [urlSearch]);

  const handlePriceChange = (min: number | '', max: number | '') => {
    setMinPrice(min);
    setMaxPrice(max);
  };

  const handleResetFilters = () => {
    setSelectedCategory('');
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setDeliveryDays(null);
    setSellerLevel('');
    setSortBy('recommended');
  };

  // Filter & Sort Logic
  const filteredGigs = useMemo(() => {
    return gigs.filter((gig) => {
      // Favorites filter
      if (isFavoritesOnly && !favorites.includes(gig.id)) {
        return false;
      }

      // Search term
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const matchesTitle = gig.title.toLowerCase().includes(query);
        const matchesCat = gig.category.toLowerCase().includes(query);
        const matchesTag = gig.tags.some((t) => t.toLowerCase().includes(query));
        const matchesSeller = gig.seller.name.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCat && !matchesTag && !matchesSeller) {
          return false;
        }
      }

      // Category
      if (selectedCategory && gig.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }

      // Budget Min
      if (minPrice !== '' && gig.startingPrice < minPrice) {
        return false;
      }

      // Budget Max
      if (maxPrice !== '' && gig.startingPrice > maxPrice) {
        return false;
      }

      // Delivery Time (Basic package)
      if (deliveryDays !== null && gig.packages.basic.deliveryDays > deliveryDays) {
        return false;
      }

      // Seller Level
      if (sellerLevel && gig.seller.level !== sellerLevel) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'price_asc') return a.startingPrice - b.startingPrice;
      if (sortBy === 'price_desc') return b.startingPrice - a.startingPrice;
      if (sortBy === 'reviews') return b.reviewCount - a.reviewCount;
      return 0; // recommended
    });
  }, [
    gigs,
    isFavoritesOnly,
    favorites,
    searchTerm,
    selectedCategory,
    minPrice,
    maxPrice,
    deliveryDays,
    sellerLevel,
    sortBy,
  ]);

  const activeFiltersCount = [
    Boolean(selectedCategory),
    Boolean(searchTerm),
    minPrice !== '',
    maxPrice !== '',
    deliveryDays !== null,
    Boolean(sellerLevel),
  ].filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Title & Breadcrumbs */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
          <span>Home</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">
            {isFavoritesOnly ? 'Saved Gigs' : selectedCategory || 'All Gigs'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              {isFavoritesOnly
                ? 'Your Saved Gigs'
                : selectedCategory
                ? selectedCategory
                : searchTerm
                ? `Results for "${searchTerm}"`
                : 'All Freelance Services'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Showing {filteredGigs.length} available service{filteredGigs.length === 1 ? '' : 's'}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Mobile Filter Trigger */}
            <button
              onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 bg-white"
            >
              <SlidersHorizontal size={14} />
              <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
            </button>

            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ArrowUpDown size={14} className="text-gray-400" />
              <span className="hidden sm:inline">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-medium focus:outline-none focus:border-[#1dbf73] bg-white"
              >
                <option value="recommended">Recommended</option>
                <option value="rating">Best Rating</option>
                <option value="reviews">Most Reviewed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-500">Active Filters:</span>

            {selectedCategory && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-[#1dbf73] text-xs font-medium rounded-full border border-emerald-200">
                Category: {selectedCategory}
                <button onClick={() => setSelectedCategory('')}><X size={12} /></button>
              </span>
            )}

            {searchTerm && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                Search: &quot;{searchTerm}&quot;
                <button onClick={() => setSearchTerm('')}><X size={12} /></button>
              </span>
            )}

            {(minPrice !== '' || maxPrice !== '') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                Budget: ${minPrice || 0} - ${maxPrice || '∞'}
                <button onClick={() => { setMinPrice(''); setMaxPrice(''); }}><X size={12} /></button>
              </span>
            )}

            {deliveryDays !== null && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                Delivery: Up to {deliveryDays} day{deliveryDays > 1 ? 's' : ''}
                <button onClick={() => setDeliveryDays(null)}><X size={12} /></button>
              </span>
            )}

            {sellerLevel && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full border border-gray-200">
                Level: {sellerLevel}
                <button onClick={() => setSellerLevel('')}><X size={12} /></button>
              </span>
            )}

            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-rose-600 hover:underline ml-1"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Main Catalog Grid & Sidebar */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter Sidebar (Desktop & Mobile Drawer) */}
        <div className={`lg:block ${mobileFilterOpen ? 'block' : 'hidden'}`}>
          <FilterSidebar
            selectedCategory={selectedCategory}
            onCategoryChange={(cat) => {
              setSelectedCategory(cat);
              setMobileFilterOpen(false);
            }}
            minPrice={minPrice}
            maxPrice={maxPrice}
            onPriceChange={handlePriceChange}
            deliveryDays={deliveryDays}
            onDeliveryChange={setDeliveryDays}
            sellerLevel={sellerLevel}
            onSellerLevelChange={setSellerLevel}
            onReset={handleResetFilters}
          />
        </div>

        {/* Results Grid */}
        <div className="flex-1">
          {filteredGigs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredGigs.map((gig) => (
                <GigCard key={gig.id} gig={gig} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center max-w-md mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
                {isFavoritesOnly ? <Heart size={32} /> : <Search size={32} />}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {isFavoritesOnly ? 'No saved gigs yet' : 'No gigs found'}
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                {isFavoritesOnly
                  ? 'Click the heart icon on any gig card to save it for later review.'
                  : 'Try broadening your search term or adjusting budget and delivery filters.'}
              </p>
              <button
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GigsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-16 text-center text-gray-400">Loading gigs catalog...</div>}>
      <GigsContent />
    </Suspense>
  );
}
