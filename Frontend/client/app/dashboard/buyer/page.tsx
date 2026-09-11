'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { BuyerDashboardSkeleton } from '@/components/skeletons/BuyerDashboardSkeleton';
import { apiFetch } from '@/lib/api';
import { ReviewModal } from '@/components/ReviewModal';
import {
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  MessageSquare,
  Package,
  ShoppingBag,
  Sparkles,
  Truck,
} from 'lucide-react';

type FilterTab = 'all' | 'in_progress' | 'delivered' | 'completed';

interface Order {
  id: string;
  gigId: string;
  gigTitle: string;
  gigImage: string;
  packageTier: string;
  price: number;
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  status: 'in_progress' | 'delivered' | 'completed';
  progressPercent: number;
  orderedAt: string;
  deliveryDate: string;
}

interface BuyerProfile {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  profileCompletion?: { percentage: number };
}

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [user, setUser] = useState<BuyerProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);

  // Fetch orders and user profile from real backend API on mount
  useEffect(() => {
    async function fetchBuyerDashboardData() {
      try {
        const response = await apiFetch('/api/dashboard/buyer');
        const data = await response.json();
        if (data.success) {
          setOrders(data.orders);
          setUser(data.user); // <--- Backend se mila user data set kiya
          const completed = data.orders.filter((order: Order) => order.status === 'completed');
          const results = await Promise.all(completed.map(async (order: Order) => {
            const reviewsResponse = await apiFetch(`/api/reviews/gig/${order.gigId}`);
            const reviewsData = await reviewsResponse.json();
            return (reviewsData.reviews || []).some((review: { orderId: string }) => review.orderId === order.id) ? order.id : null;
          }));
          setReviewedOrderIds(new Set(results.filter((id): id is string => Boolean(id))));
        }
      } catch (error) {
        console.error('Error fetching buyer orders:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchBuyerDashboardData();
  }, []);

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  // Calculate metrics
  const totalSpent = orders.reduce((sum, o) => sum + (o.price || 0), 0);
  const activeCount = orders.filter((o) => o.status === 'in_progress').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  const handleMessageSeller = (order: Order) => {
    router.push(`/messages?sellerId=${order.sellerId}&gigId=${order.gigId}`);
  };

  const handleCompleteOrder = async (orderId: string) => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed', progressPercent: 100 }),
      });

      const data = await response.json();
      if (data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((ord) =>
            ord.id === orderId ? { ...ord, status: 'completed', progressPercent: 100 } : ord
          )
        );
        setJustCompletedId(orderId);
        setTimeout(() => setJustCompletedId(null), 3000);
      } else {
        alert('Error updating order status: ' + data.error);
      }
    } catch (error) {
      console.error('Error completing order:', error);
    }
  };

  const submitReview = async (payload: { orderId: string; rating: number; comment: string }) => {
    const response = await apiFetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to submit review');
    setReviewedOrderIds((previous) => new Set(previous).add(payload.orderId));
  };

  if (loading) return <BuyerDashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with Dynamic User Profile Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <img
              src={user?.avatar || '/images/default-avatar.png'}
              alt={user?.name || 'Buyer'}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#1dbf73] shadow-xs"
            />
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
              <ShoppingBag size={13} />
              <span>Client Workspace</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Welcome back, {user?.name || 'Buyer'}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500"><span>Profile completion</span><div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-[#1dbf73]" style={{ width: `${user?.profileCompletion?.percentage || 0}%` }} /></div><span className="font-semibold text-gray-700">{user?.profileCompletion?.percentage || 0}%</span></div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {user?.email || 'Monitor real-time progress, review deliveries, and communicate with your freelancers.'}
            </p>
          </div>
        </div>

        <Link
          href="/gigs"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white text-xs font-bold rounded-xl transition-colors shadow-sm self-start sm:self-auto"
        >
          <Sparkles size={14} />
          <span>Explore More Gigs</span>
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1dbf73] flex items-center justify-center shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Total Spent</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">${totalSpent}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Orders</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{activeCount}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Truck size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Delivered</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{deliveredCount}</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Completed</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Orders Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 overflow-x-auto pb-px mb-6">
        {[
          { key: 'all', label: 'All Orders', count: orders.length },
          { key: 'in_progress', label: 'Active', count: activeCount },
          { key: 'delivered', label: 'Delivered', count: deliveredCount },
          { key: 'completed', label: 'Completed', count: completedCount },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as FilterTab)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === tab.key
                ? 'border-[#1dbf73] text-[#1dbf73]'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                activeTab === tab.key ? 'bg-emerald-100 text-[#1dbf73]' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Just Completed Alert Banner */}
      {justCompletedId && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 size={18} className="text-[#1dbf73]" />
          <span>Order #{justCompletedId} marked as completed! Payment has been safely released to the seller.</span>
        </div>
      )}

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                {/* Gig & Seller Info */}
                <div className="flex items-start sm:items-center gap-4 min-w-0">
                  <Link href={`/gigs/${order.gigId}`}>
                    <img
                      src={order.gigImage || 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d'}
                      alt={order.gigTitle}
                      className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl shrink-0 hover:opacity-90 transition-opacity"
                    />
                  </Link>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono font-semibold text-gray-400">
                        #{order.id}
                      </span>
                      <OrderStatusBadge status={order.status} size="sm" />
                      <span className="text-[11px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                        {order.packageTier} Package
                      </span>
                    </div>

                    <Link href={`/gigs/${order.gigId}`} className="group">
                      <h3 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#1dbf73] transition-colors line-clamp-1">
                        {order.gigTitle}
                      </h3>
                    </Link>

                    {/* Seller attribution */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                      <span>Seller:</span>
                      <img
                        src={order.sellerAvatar || '/images/default-avatar.png'}
                        alt={order.sellerName}
                        className="w-4 h-4 rounded-full object-cover"
                      />
                      <span className="font-semibold text-gray-800">{order.sellerName}</span>
                    </div>
                  </div>
                </div>

                {/* Price & Dates */}
                <div className="flex items-center justify-between lg:justify-end gap-6 text-xs text-gray-500 shrink-0">
                  <div>
                    <span className="text-[11px] text-gray-400 block">Ordered On</span>
                    <span className="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                      <Calendar size={12} /> {order.orderedAt || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-gray-400 block">Est. Delivery</span>
                    <span className="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                      <Clock size={12} /> {order.deliveryDate || 'N/A'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-gray-400 block">Amount</span>
                    <span className="text-lg font-black text-gray-900">${order.price}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Progress & Action Controls */}
              <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Progress bar */}
                <div className="flex-1 max-w-md">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 mb-1.5">
                    <span>Delivery Progress</span>
                    <span>{order.progressPercent || 0}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        order.status === 'completed'
                          ? 'bg-[#1dbf73]'
                          : order.status === 'delivered'
                          ? 'bg-purple-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${order.progressPercent || 0}%` }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleMessageSeller(order)}
                    className="px-3.5 py-2 border border-gray-300 hover:border-[#1dbf73] hover:text-[#1dbf73] text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} />
                    <span>Message Seller</span>
                  </button>

                  <Link
                    href={`/gigs/${order.gigId}`}
                    className="p-2 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-xl transition-colors"
                    title="View Gig Details"
                  >
                    <ExternalLink size={15} />
                  </Link>

                  {/* Mark as Completed / Received */}
                  {order.status === 'delivered' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-4 py-2 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-xs rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} />
                      <span>Accept &amp; Complete</span>
                    </button>
                  )}

                  {order.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteOrder(order.id)}
                      className="px-3 py-2 bg-gray-100 hover:bg-emerald-50 hover:text-[#1dbf73] text-gray-600 font-medium text-xs rounded-xl transition-colors"
                    >
                      Mark as Received
                    </button>
                  )}
                  {order.status === 'completed' && (reviewedOrderIds.has(order.id) ? (
                    <span className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">Review Submitted</span>
                  ) : (
                    <button onClick={() => setReviewOrderId(order.id)} className="rounded-xl bg-[#1dbf73] px-4 py-2 text-xs font-bold text-white hover:bg-[#19a463]">Leave Review</button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Package size={32} />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No orders found</h3>
          <p className="text-xs text-gray-500 mb-6">
            You don&apos;t have any orders matching the &quot;{activeTab}&quot; filter status.
          </p>
          <Link
            href="/gigs"
            className="px-5 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white text-xs font-bold rounded-lg transition-colors shadow-sm inline-block"
          >
            Browse Marketplace Gigs
          </Link>
        </div>
      )}
      {reviewOrderId && <ReviewModal orderId={reviewOrderId} onClose={() => setReviewOrderId(null)} onSubmit={submitReview} />}
    </div>
  );
}
