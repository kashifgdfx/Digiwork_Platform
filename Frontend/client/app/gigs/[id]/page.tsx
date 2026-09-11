'use client';

import React, { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { ReviewList } from '@/components/ReviewList';
import { CheckoutModal } from '@/components/CheckoutModal';
import { StarRating } from '@/components/StarRating';
import { GigCard } from '@/components/GigCard';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Globe,
  Heart,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Share2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X as CrossIcon,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function GigDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const gigId = resolvedParams.id;
  const router = useRouter();

  const { gigs, isFavorite, toggleFavorite, startConversationWithSeller, currentUser } = useApp();
  const gig = gigs.find((g) => g.id === gigId);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [activeTier, setActiveTier] = useState<'basic' | 'standard' | 'premium'>('basic');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isContacting, setIsContacting] = useState(false);

  if (!gig) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Gig Not Found</h2>
        <p className="text-gray-500 mb-6">
          The freelance service you are looking for does not exist or has been removed.
        </p>
        <Link
          href="/gigs"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1dbf73] text-white font-semibold rounded-lg text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to All Gigs</span>
        </Link>
      </div>
    );
  }

  const favorited = isFavorite(gig.id);
  const isOwnGig = currentUser?.id === gig.seller.id;
  const selectedPackage = gig.packages[activeTier];
  const displayReviews: Array<{ id: string; reviewerName: string; reviewerAvatar: string; reviewerCountry: string; rating: number; comment: string; createdAt: string }> = [];

  // Related gigs
  const relatedGigs = gigs
    .filter((g) => g.category === gig.category && g.id !== gig.id)
    .slice(0, 4);

  const handleContactSeller = async () => {
    setContactError(null);
    setIsContacting(true);
    try {
      const convId = await startConversationWithSeller(gig.seller, gig);
      router.push(`/messages?conversationId=${encodeURIComponent(convId)}`);
    } catch (error) {
      setContactError(error instanceof Error ? error.message : 'Unable to start conversation');
    } finally {
      setIsContacting(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-gray-500 mb-6">
        <Link href="/" className="hover:text-[#1dbf73] transition-colors">Home</Link>
        <span>/</span>
        <Link
          href={`/gigs?category=${encodeURIComponent(gig.category)}`}
          className="hover:text-[#1dbf73] transition-colors"
        >
          {gig.category}
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate max-w-xs">{gig.subcategory}</span>
      </nav>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column (8 cols): Gallery, Description, FAQs, Reviews */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
          {/* Gig Title */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug mb-4">
              {gig.title}
            </h1>

            {/* Seller Header Brief */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <img
                  src={gig.seller.avatar}
                  alt={gig.seller.name}
                  className="w-10 h-10 rounded-full object-cover ring-2 ring-gray-100"
                />
                <div>
                  <div className="flex items-center gap-1.5 font-bold text-gray-900 text-sm">
                    <span>{gig.seller.name}</span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {gig.seller.level}
                    </span>
                  </div>
                  <span className="text-gray-400">@{gig.seller.username}</span>
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <div className="flex items-center gap-1">
                <StarRating rating={gig.rating} reviewCount={gig.reviewCount} size="md" />
              </div>

              <div className="h-6 w-px bg-gray-200 hidden sm:block" />

              <div className="text-gray-500">
                <span className="font-semibold text-gray-800">{gig.ordersInQueue}</span> orders in queue
              </div>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => toggleFavorite(gig.id)}
                  className={`p-2 rounded-full border transition-colors ${
                    favorited
                      ? 'border-rose-200 bg-rose-50 text-rose-500'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-500'
                  }`}
                  title={favorited ? 'Saved' : 'Save Gig'}
                >
                  <Heart size={18} className={favorited ? 'fill-rose-500 text-rose-500' : ''} />
                </button>
                <button
                  onClick={handleShare}
                  className="p-2 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors relative"
                  title="Share link"
                >
                  <Share2 size={18} />
                  {copiedLink && (
                    <span className="absolute -top-8 -left-6 bg-gray-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Image Gallery */}
          <div className="space-y-3">
            <div className="relative aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden bg-gray-900 shadow-md border border-gray-100">
              <img
                src={gig.images[activeImageIndex] || gig.images[0]}
                alt={gig.title}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {gig.isFeatured && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#1dbf73] text-white text-xs font-bold rounded-md shadow uppercase tracking-wider">
                  Featured Choice
                </span>
              )}
            </div>

            {/* Thumbnail Strip */}
            {gig.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {gig.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`relative w-20 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                      activeImageIndex === idx
                        ? 'border-[#1dbf73] shadow-md ring-2 ring-emerald-200'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* About This Gig */}
          <div className="pt-4 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About This Gig</h2>
            <div className="prose prose-sm text-gray-700 leading-relaxed max-w-none whitespace-pre-line">
              {gig.description}
            </div>

            {/* Key Deliverable Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 bg-gray-50/80 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <Check size={16} className="text-[#1dbf73] shrink-0" />
                <span>100% Satisfaction & Quality Guarantee</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <Check size={16} className="text-[#1dbf73] shrink-0" />
                <span>Full Commercial Use Rights Included</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <Check size={16} className="text-[#1dbf73] shrink-0" />
                <span>Fast On-Time Turnaround</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-gray-800">
                <Check size={16} className="text-[#1dbf73] shrink-0" />
                <span>Direct 1-on-1 Communication</span>
              </div>
            </div>

            {/* Search Tags */}
            <div className="flex flex-wrap items-center gap-2 mt-6">
              <span className="text-xs font-semibold text-gray-400 mr-1">Tags:</span>
              {gig.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/gigs?search=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#1dbf73] text-gray-700 text-xs font-medium rounded-full transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* About The Seller Card */}
          <div className="pt-6 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About The Seller</h2>
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <img
                    src={gig.seller.avatar}
                    alt={gig.seller.name}
                    className="w-16 h-16 rounded-full object-cover ring-4 ring-emerald-50"
                  />
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{gig.seller.name}</h3>
                    <p className="text-xs text-gray-500">@{gig.seller.username}</p>
                    <span className="inline-block mt-1 text-[11px] font-semibold text-[#1dbf73] bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {gig.seller.level}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleContactSeller}
                  disabled={isOwnGig || isContacting}
                  className="px-5 py-2.5 border-2 border-gray-900 hover:border-[#1dbf73] hover:text-[#1dbf73] text-gray-900 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>{isContacting ? 'Opening...' : 'Contact Seller'}</span>
                </button>
              </div>

              {contactError && (
                <p className="mt-3 text-xs text-red-600" role="alert">
                  {contactError}
                </p>
              )}

              {/* Seller Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 border-b border-gray-100 text-xs">
                <div>
                  <span className="text-gray-400 block">From</span>
                  <span className="font-semibold text-gray-800">{gig.seller.country}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Member since</span>
                  <span className="font-semibold text-gray-800">{gig.seller.memberSince}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Avg. response time</span>
                  <span className="font-semibold text-gray-800">{gig.seller.responseTime}</span>
                </div>
                <div>
                  <span className="text-gray-400 block">Languages</span>
                  <span className="font-semibold text-gray-800">{typeof gig.seller.languages[0] === 'string' ? gig.seller.languages[0] : gig.seller.languages[0]?.language || 'English'}</span>
                </div>
              </div>

              {/* Seller Bio */}
              <p className="text-xs text-gray-600 leading-relaxed pt-4">
                {gig.seller.bio}
              </p>
            </div>
          </div>

          {/* Frequently Asked Questions */}
          {gig.faqs && gig.faqs.length > 0 && (
            <div className="pt-6 border-t border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle size={20} className="text-[#1dbf73]" />
                <span>Frequently Asked Questions</span>
              </h2>

              <div className="space-y-3">
                {gig.faqs.map((faq, idx) => {
                  const isOpen = expandedFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-xl overflow-hidden transition-all bg-white"
                    >
                      <button
                        onClick={() => setExpandedFaq(isOpen ? null : idx)}
                        className="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-sm text-gray-800 hover:text-[#1dbf73] transition-colors"
                      >
                        <span>{faq.question}</span>
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-xs text-gray-600 leading-relaxed border-t border-gray-50 pt-2">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Verified Customer Reviews */}
          <div className="hidden" aria-hidden="true">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Reviews & Ratings</h2>
                <div className="flex items-center gap-2 mt-1">
                  <StarRating rating={gig.rating} reviewCount={gig.reviewCount} size="md" />
                </div>
              </div>

              {/* Rating breakdown preview */}
              <div className="w-full sm:w-64 space-y-1.5 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="w-12 text-right font-medium">5 Stars</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[94%]" />
                  </div>
                  <span className="w-8 text-right font-medium">94%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-right font-medium">4 Stars</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[5%]" />
                  </div>
                  <span className="w-8 text-right font-medium">5%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-12 text-right font-medium">3 Stars</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400 rounded-full w-[1%]" />
                  </div>
                  <span className="w-8 text-right font-medium">1%</span>
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {displayReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-gray-50/70 border border-gray-100 rounded-xl p-5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={rev.reviewerAvatar}
                        alt={rev.reviewerName}
                        className="w-9 h-9 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{rev.reviewerName}</p>
                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                          <Globe size={11} /> {rev.reviewerCountry}
                        </p>
                      </div>
                    </div>

                    <span className="text-[11px] text-gray-400">{rev.createdAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400">
                      {'★'.repeat(rev.rating)}
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded flex items-center gap-1">
                      <UserCheck size={11} /> Verified Buyer
                    </span>
                  </div>

                  <p className="text-xs text-gray-700 leading-relaxed">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <ReviewList gigId={gig.id} rating={gig.rating} reviewCount={gig.reviewCount} />
        </div>

        {/* Right Column (4-5 cols): Sticky 3-Tier Pricing Selector */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="sticky top-20 bg-white border border-gray-200 rounded-2xl shadow-xl overflow-hidden">
            {/* Package Tabs */}
            <div className="grid grid-cols-3 border-b border-gray-200 bg-gray-50 text-xs font-bold">
              {(['basic', 'standard', 'premium'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setActiveTier(tier)}
                  className={`py-3.5 text-center capitalize transition-all ${
                    activeTier === tier
                      ? 'bg-white text-[#1dbf73] border-b-2 border-[#1dbf73] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100/70'
                  }`}
                >
                  {tier}
                </button>
              ))}
            </div>

            {/* Selected Package Details */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  {selectedPackage.name} Package
                </span>
                <span className="text-2xl font-black text-gray-900">
                  ${selectedPackage.price}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-1">
                  {selectedPackage.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {selectedPackage.description}
                </p>
              </div>

              {/* Delivery Turnaround & Revisions */}
              <div className="flex items-center gap-6 text-xs font-semibold text-gray-700 pt-2 border-t border-gray-100">
                <div className="flex items-center gap-1.5">
                  <Clock size={16} className="text-[#1dbf73]" />
                  <span>{selectedPackage.deliveryDays} Days Delivery</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <RotateCcw size={16} className="text-[#1dbf73]" />
                  <span>
                    {typeof selectedPackage.revisions === 'number'
                      ? `${selectedPackage.revisions} Revisions`
                      : 'Unlimited Revisions'}
                  </span>
                </div>
              </div>

              {/* Features Checklist */}
              <div className="space-y-2.5 text-xs text-gray-600">
                <p className="font-bold text-gray-700 text-[11px] uppercase tracking-wider">
                  What&apos;s Included
                </p>
                {selectedPackage.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    {f.included ? (
                      <Check size={15} className="text-[#1dbf73] shrink-0" />
                    ) : (
                      <CrossIcon size={15} className="text-gray-300 shrink-0" />
                    )}
                    <span className={f.included ? 'text-gray-800' : 'text-gray-400'}>
                      {f.name}
                    </span>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIsCheckoutOpen(true)}
                  className="w-full py-3.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>Continue (${selectedPackage.price})</span>
                </button>

                <button
                  onClick={handleContactSeller}
                  disabled={isOwnGig || isContacting}
                  className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <MessageSquare size={14} />
                  <span>{isContacting ? 'Opening...' : `Contact Seller (${gig.seller.name})`}</span>
                </button>
              </div>

              {/* Escrow Guarantee */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-gray-400 pt-2">
                <ShieldCheck size={14} className="text-[#1dbf73]" />
                <span>Simulated Escrow Protection</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Gigs Section */}
      {relatedGigs.length > 0 && (
        <section className="mt-16 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              More Services in {gig.category}
            </h2>
            <Link
              href={`/gigs?category=${encodeURIComponent(gig.category)}`}
              className="text-xs font-semibold text-[#1dbf73] hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedGigs.map((rel) => (
              <GigCard key={rel.id} gig={rel} />
            ))}
          </div>
        </section>
      )}

      {/* Interactive Checkout Modal */}
      <CheckoutModal
        gig={gig}
        packageTier={selectedPackage}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
