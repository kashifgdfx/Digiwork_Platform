'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { CreateGigModal } from '@/components/CreateGigModal';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { SellerDashboardSkeleton } from '@/components/skeletons/SellerDashboardSkeleton';
import { apiFetch } from '@/lib/api';
import { SellerRatingStats } from '@/types';
import { AnalyticsSkeleton } from '@/components/skeletons/AnalyticsSkeleton';
import { socketService } from '@/lib/socket';
import {
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Layers,
  PlusCircle,
  Star,
  Trash2,
  Truck,
  UserCheck,
  Camera,
} from 'lucide-react';

interface UserProfile {
  name: string;
  email: string;
  username: string;
  avatar?: string;
  level?: string;
  profileCompletion?: { percentage: number };
}

interface Gig {
  id: string;
  title: string;
  category: string;
  subcategory: string;
  startingPrice: number;
  images: string[];
  rating: number;
  reviewCount: number;
  ordersInQueue: number;
}

interface Order {
  id: string;
  gigId: string;
  gigTitle: string;
  packageTier: string;
  price: number;
  buyerName: string;
  status: 'in_progress' | 'delivered' | 'completed';
  deliveryDate: string;
}

export default function SellerDashboardPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusUpdatedId, setStatusUpdatedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [gigs, setGigs] = useState<Gig[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviewStats, setReviewStats] = useState<SellerRatingStats | null>(null);

  // Fetch seller dashboard data and profile from backend API on mount
  useEffect(() => {
    async function fetchSellerData() {
      try {
        const response = await apiFetch('/api/dashboard/seller');
        const data = await response.json();
        if (data.success) {
          setUser(data.user || null);
          setGigs(data.gigs || []);
          setOrders(data.orders || []);
          setReviewStats(data.reviewStats || null);
        }
      } catch (error) {
        console.error('Error fetching seller dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSellerData();
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();
    const refreshReviews = async (payload: { sellerId: string }) => {
      const response = await apiFetch('/api/dashboard/seller');
      const data = await response.json();
      if (response.ok && data.success) setReviewStats(data.reviewStats || null);
    };
    socket?.on('reviewCreated', refreshReviews);
    socket?.on('reviewUpdated', refreshReviews);
    socket?.on('reviewDeleted', refreshReviews);
    return () => { socket?.off('reviewCreated', refreshReviews); socket?.off('reviewUpdated', refreshReviews); socket?.off('reviewDeleted', refreshReviews); };
  }, []);

  // Handle File Selection and Upload directly from computer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    setUploading(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;

        const response = await apiFetch('/api/profile/avatar', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64String }),
        });

        const data = await response.json();
        if (data.success) {
          setUser((prev) => (prev ? { ...prev, avatar: data.user?.avatar } : null));
          alert('Profile picture updated successfully!');
        } else {
          alert('Failed to update avatar: ' + data.error);
        }
        setUploading(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Something went wrong while uploading image.');
      setUploading(false);
    }
  };

  const displayGigs = gigs.length > 0 ? gigs : [];

  const activeOrders = orders.filter((o) => o.status === 'in_progress');
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const completedOrders = orders.filter((o) => o.status === 'completed');

  const totalEarnings = completedOrders.reduce((acc, o) => acc + o.price * 0.8, 0);
  const pendingClearance = deliveredOrders.reduce((acc, o) => acc + o.price * 0.8, 0);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: 'delivered' | 'completed') => {
    try {
      const response = await apiFetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setOrders((prevOrders) =>
          prevOrders.map((ord) => (ord.id === orderId ? { ...ord, status: newStatus } : ord))
        );
        setStatusUpdatedId(orderId);
        setTimeout(() => setStatusUpdatedId(null), 3000);
      } else {
        alert('Error updating status: ' + data.error);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const handleDeleteGig = async (gigId: string) => {
    if (!confirm('Are you sure you want to delete this gig?')) return;

    try {
      const response = await apiFetch(`/api/gigs/${gigId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        setGigs((prevGigs) => prevGigs.filter((g) => g.id !== gigId));
      } else {
        alert('Error deleting gig: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting gig:', error);
    }
  };

  if (loading) return <SellerDashboardSkeleton />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Header Bar with User Profile Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {/* Clickable Profile Avatar to Open File Explorer */}
          <div
            className="relative group cursor-pointer shrink-0"
            onClick={() => !uploading && fileInputRef.current?.click()}
            title="Click to upload new profile picture"
          >
            <img
              src={user?.avatar || '/images/default-avatar.png'}
              alt={user?.name || 'User'}
              className={`w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm ${
                uploading ? 'opacity-50' : ''
              }`}
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
              <Camera size={16} />
              <span className="text-[9px] font-bold mt-0.5">{uploading ? 'Uploading...' : 'Upload'}</span>
            </div>
          </div>

          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full mb-1">
              <UserCheck size={13} />
              <span>{user?.level || 'New Seller'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Welcome back, {user ? user.name : 'Seller'}!
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              <span className="font-medium text-gray-700">{user?.email}</span> | Manage your services and track revenue.
            </p>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500"><span>Profile completion</span><div className="h-1.5 w-28 overflow-hidden rounded-full bg-gray-200"><div className="h-full bg-[#1dbf73]" style={{ width: `${user?.profileCompletion?.percentage || 0}%` }} /></div><span className="font-semibold text-gray-700">{user?.profileCompletion?.percentage || 0}%</span></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/buyer"
            className="px-4 py-2.5 border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
          >
            Switch to Buying
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
          >
            <PlusCircle size={16} />
            <span>+ Create New Gig</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1dbf73] flex items-center justify-center shrink-0">
            <DollarSign size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Net Earnings</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">${totalEarnings.toFixed(0)}</span>
            <span className="text-[11px] text-gray-400 block">${pendingClearance.toFixed(0)} pending</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Orders</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{activeOrders.length}</span>
            <span className="text-[11px] text-blue-600 font-medium block">In production</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <Layers size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Active Gigs</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{displayGigs.length}</span>
            <span className="text-[11px] text-purple-600 font-medium block">Published in catalog</span>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Star size={22} />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Rating Score</span>
            <span className="text-xl sm:text-2xl font-black text-gray-900">{reviewStats?.averageRating.toFixed(1) || '0.0'}</span>
            <span className="text-[11px] text-amber-600 font-medium block">{reviewStats?.totalReviews || 0} verified reviews</span>
          </div>
        </div>
      </div>

      {reviewStats ? <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-xs"><div className="mb-5 flex items-end justify-between"><div><h2 className="text-lg font-bold text-gray-900">Review analytics</h2><p className="text-xs text-gray-500">Ratings from completed orders</p></div><div className="text-right"><p className="text-2xl font-black text-gray-900">{reviewStats.averageRating.toFixed(1)} <span className="text-amber-400">★</span></p><p className="text-xs text-gray-500">{reviewStats.totalReviews} total reviews</p></div></div><div className="space-y-2">{reviewStats.breakdown.map(({ star, count }) => <div key={star} className="flex items-center gap-3 text-xs"><span className="w-10 font-semibold text-gray-600">{star} star</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-amber-400" style={{ width: `${reviewStats.totalReviews ? (count / reviewStats.totalReviews) * 100 : 0}%` }} /></div><span className="w-8 text-right font-semibold text-gray-600">{count}</span></div>)}</div></section> : <AnalyticsSkeleton />}

      {/* Status Updated Toast Notification */}
      {statusUpdatedId && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-3 text-xs font-medium">
          <CheckCircle2 size={18} className="text-[#1dbf73]" />
          <span>Order #{statusUpdatedId} successfully updated and client notified!</span>
        </div>
      )}

      {/* Section 1: Incoming Client Orders Queue */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Incoming Client Orders</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review requirements, advance production stages, and upload deliverables.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full">
            {orders.length} total orders
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-600">
            <thead className="bg-gray-50/70 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-6">Order</th>
                <th className="py-3.5 px-6">Client</th>
                <th className="py-3.5 px-6">Service &amp; Package</th>
                <th className="py-3.5 px-6">Due Date</th>
                <th className="py-3.5 px-6">Net Payout</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Workflow Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50/60 transition-colors">
                  <td className="py-4 px-6 font-mono font-bold text-gray-900">
                    #{order.id}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-[#1dbf73] font-bold flex items-center justify-center text-xs">
                        {order.buyerName ? order.buyerName.slice(0, 1) : 'U'}
                      </div>
                      <span className="font-semibold text-gray-800">{order.buyerName || 'Client'}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 max-w-xs">
                    <Link
                      href={`/gigs/${order.gigId}`}
                      className="text-gray-900 font-semibold hover:text-[#1dbf73] line-clamp-1 truncate block"
                    >
                      {order.gigTitle}
                    </Link>
                    <span className="text-[11px] text-gray-400 block mt-0.5">
                      {order.packageTier} Package
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-700 font-medium">
                    {order.deliveryDate}
                  </td>
                  <td className="py-4 px-6 text-gray-900 font-black text-sm">
                    ${(order.price * 0.8).toFixed(0)}
                  </td>
                  <td className="py-4 px-6">
                    <OrderStatusBadge status={order.status} size="sm" />
                  </td>
                  <td className="py-4 px-6 text-right">
                    {order.status === 'in_progress' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'delivered')}
                        className="px-3.5 py-1.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-xs rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
                      >
                        <Truck size={13} />
                        <span>Deliver Work</span>
                      </button>
                    )}

                    {order.status === 'delivered' && (
                      <button
                        onClick={() => handleUpdateOrderStatus(order.id, 'completed')}
                        className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} />
                        <span>Complete Order</span>
                      </button>
                    )}

                    {order.status === 'completed' && (
                      <span className="text-gray-400 text-xs italic">Funds Cleared</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 2: Manage Your Gigs */}
      <section className="bg-white border border-gray-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Active Gigs</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Services currently active and discoverable on the marketplace.
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-xs font-bold text-[#1dbf73] hover:underline flex items-center gap-1"
          >
            <span>+ Add Another Gig</span>
          </button>
        </div>

        <div className="divide-y divide-gray-100">
          {displayGigs.map((gig) => (
            <div
              key={gig.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <img
                  src={gig.images?.[0] || 'https://images.unsplash.com/photo-1522542550221-31fd19575a2d'}
                  alt={gig.title}
                  className="w-20 h-14 object-cover rounded-xl shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                      {gig.category}
                    </span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{gig.subcategory}</span>
                  </div>

                  <Link href={`/gigs/${gig.id}`}>
                    <h4 className="text-sm font-bold text-gray-900 hover:text-[#1dbf73] transition-colors truncate">
                      {gig.title}
                    </h4>
                  </Link>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                    <span>
                      Starting: <strong className="text-gray-900">${gig.startingPrice}</strong>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      ★ {gig.rating} ({gig.reviewCount})
                    </span>
                    <span>•</span>
                    <span>{gig.ordersInQueue} in queue</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                <Link
                  href={`/gigs/${gig.id}`}
                  className="px-3.5 py-1.5 border border-gray-300 hover:border-[#1dbf73] hover:text-[#1dbf73] text-gray-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink size={13} />
                  <span>Preview</span>
                </Link>

                <button
                  onClick={() => handleDeleteGig(gig.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete gig"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Create Gig Modal */}
      <CreateGigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
