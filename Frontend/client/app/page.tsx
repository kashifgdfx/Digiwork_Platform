'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { mockCategories } from '@/data/mockData';
import { GigCard } from '@/components/GigCard';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  DollarSign,
  Search,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { gigs, searchQuery, setSearchQuery } = useApp();
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('All');

  const popularTags = ['Next.js', 'Logo Design', 'WordPress', 'AI Services', 'Video Editing', 'SEO'];

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/gigs?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/gigs');
    }
  };

  // Filter gigs for homepage section
  const filteredGigs = selectedCategoryTab === 'All'
    ? gigs.slice(0, 8)
    : gigs.filter((g) => g.category.toLowerCase().includes(selectedCategoryTab.toLowerCase())).slice(0, 8);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-600/40 text-emerald-300 text-xs font-semibold mb-6 backdrop-blur-md">
            <Sparkles size={14} className="text-emerald-400 animate-spin" />
            <span>Over 3 Million High-Converting Services Ready to Launch</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white mb-6">
            Find the right <span className="text-[#1dbf73] italic">freelance</span> service, right away
          </h1>

          <p className="text-gray-300 text-base sm:text-lg max-w-2xl mx-auto mb-8 font-normal">
            Work with top-tier designers, full-stack engineers, video creators, and AI specialists to accelerate your vision.
          </p>

          {/* Hero Search Box */}
          <form
            onSubmit={handleHeroSearch}
            className="flex flex-col sm:flex-row items-center max-w-3xl mx-auto bg-white rounded-xl sm:rounded-full p-2 shadow-2xl gap-2 text-gray-900"
          >
            <div className="flex items-center w-full px-3 py-2">
              <Search size={20} className="text-gray-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Try &apos;Next.js web app&apos; or &apos;minimalist logo&apos;..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-sm sm:text-base outline-none text-gray-800 placeholder-gray-400 bg-transparent"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-8 py-3 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-lg sm:rounded-full transition-all shrink-0 shadow-md hover:shadow-lg"
            >
              Search
            </button>
          </form>

          {/* Popular Tag Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-6 text-xs text-emerald-200">
            <span className="font-semibold text-gray-300">Popular:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSearchQuery(tag);
                  router.push(`/gigs?search=${encodeURIComponent(tag)}`);
                }}
                className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full border border-white/10 text-white transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Trusted Companies Bar */}
          <div className="mt-14 pt-8 border-t border-emerald-800/50 flex flex-wrap items-center justify-center gap-8 text-xs font-semibold text-emerald-300/70 uppercase tracking-wider">
            <span>Trusted by:</span>
            <span className="text-lg font-bold tracking-tight text-white/60 hover:text-white transition-colors">Meta</span>
            <span className="text-lg font-bold tracking-tight text-white/60 hover:text-white transition-colors">Google</span>
            <span className="text-lg font-bold tracking-tight text-white/60 hover:text-white transition-colors">NETFLIX</span>
            <span className="text-lg font-bold tracking-tight text-white/60 hover:text-white transition-colors">P&amp;G</span>
            <span className="text-lg font-bold tracking-tight text-white/60 hover:text-white transition-colors">PayPal</span>
          </div>
        </div>
      </section>

      {/* Category Visual Cards Carousel/Grid */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Explore by Category
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Browse thousands of professional freelance gigs tailored for your next project
            </p>
          </div>
          <Link
            href="/gigs"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#1dbf73] hover:underline"
          >
            <span>All Categories</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {mockCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/gigs?category=${encodeURIComponent(cat.name)}`}
              className="group relative h-52 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <img
                src={cat.image}
                alt={cat.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 flex flex-col justify-end text-white">
                <span className="text-[11px] font-medium text-emerald-300 tracking-wide uppercase">
                  {cat.gigCount}+ services
                </span>
                <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                  {cat.name}
                </h3>
                <p className="text-[11px] text-gray-300 line-clamp-1 mt-0.5">
                  {cat.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Gigs Grid */}
      <section className="py-14 bg-gray-50/70 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Featured Freelance Gigs
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Handpicked top-rated services with verified buyer reviews
              </p>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              {['All', 'Programming', 'Graphics', 'Video', 'Marketing'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSelectedCategoryTab(tab)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCategoryTab === tab
                      ? 'bg-[#1dbf73] text-white shadow-sm'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGigs.map((gig) => (
              <GigCard key={gig.id} gig={gig} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/gigs"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-gray-800 text-white font-bold text-sm rounded-xl transition-all shadow-sm hover:shadow-md"
            >
              <Compass size={18} />
              <span>Explore All {gigs.length} Available Gigs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Value Proposition Section */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight leading-tight mb-6">
              A whole world of freelance talent at your fingertips
            </h2>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#1dbf73] flex items-center justify-center shrink-0">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    Stick to your budget
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Find the right service for every price point. No hourly rates, just project-based upfront pricing.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Clock size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    Get quality work done quickly
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Hand your project over to an experienced freelancer in minutes and enjoy fast, reliable turnaround times.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    Pay when you&apos;re 100% happy
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Upfront quotes mean no surprises. Payments are held safely in escrow and only released upon your approval.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                  <Award size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-base mb-1">
                    Count on round-the-clock support
                  </h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Our dedicated support team is available 24/7 to answer questions and keep your projects running smoothly.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Showcase Banner */}
          <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider inline-block">
                Fiverr Pro Enterprise
              </span>
              <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                Scale your business with the top 1% vetted freelance talent
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Connect with pre-screened creators and dedicated project managers designed for agency scale and enterprise speed.
              </p>

              <ul className="space-y-2 pt-2 text-xs text-gray-200">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1dbf73]" />
                  <span>Dedicated Business Account Manager</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1dbf73]" />
                  <span>Team Collaboration Workspace &amp; Shared Billing</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#1dbf73]" />
                  <span>Handpicked verified Top-Tier Specialists</span>
                </li>
              </ul>

              <div className="pt-4">
                <Link
                  href="/gigs"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-xl transition-colors shadow-lg"
                >
                  <Zap size={16} />
                  <span>Explore Pro Services</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
