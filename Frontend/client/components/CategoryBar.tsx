'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { mockCategories } from '@/data/mockData';

export const CategoryBar: React.FC = () => {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <nav className="border-b border-gray-200 bg-white hidden md:block overflow-x-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ul className="flex items-center space-x-6 py-2.5 text-sm whitespace-nowrap">
          <li>
            <Link
              href="/gigs"
              className={`hover:text-[#1dbf73] transition-colors py-1 inline-block ${
                !currentCategory
                  ? 'text-gray-600 font-medium'
                  : 'text-gray-600'
              }`}
            >
              All Categories
            </Link>
          </li>
          {mockCategories.map((cat) => {
            const isActive = currentCategory === cat.name;
            return (
              <li key={cat.id}>
                <Link
                  href={`/gigs?category=${encodeURIComponent(cat.name)}`}
                  className={`hover:text-[#1dbf73] transition-colors py-1 inline-block relative ${
                    isActive
                      ? 'text-[#1dbf73] font-semibold after:absolute after:bottom-[-10px] after:left-0 after:right-0 after:h-[2px] after:bg-[#1dbf73]'
                      : 'text-gray-600'
                  }`}
                >
                  {cat.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
};
