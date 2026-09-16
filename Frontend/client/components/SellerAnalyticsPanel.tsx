'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingBag,
  Star,
  Eye,
  Users,
  Clock,
  Activity,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { fetchSellerAnalytics } from '@/lib/api';

interface AnalyticsData {
  revenue: number;
  totalOrders: number;
  completedOrders: number;
  averageRating: number;

  gigViewsToday: number;
  gigViewsWeek: number;
  gigViewsMonth: number;
  uniqueVisitors: number;

  conversionRate: number;

  totalWorkHours: number;
  todayWorkHours: number;
  weeklyWorkHours: number;
  totalWorkSessions: number;

  responseRate: number;
  averageResponseTime: string;
  completionRate: number;
  successRate: number;

  online: boolean;
  activeOrders: number;
  unreadMessages: number;
  messagesToday: number;
}

export function SellerAnalyticsPanel() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadAnalytics() {
    try {
      const data = await fetchSellerAnalytics();

      setAnalytics({
        revenue: data.sellerPerformance.revenue,
        totalOrders: data.sellerPerformance.totalOrders,
        completedOrders: data.sellerPerformance.completedOrders,
        averageRating: data.sellerPerformance.averageRating,
        gigViewsToday: data.gigAnalytics.viewsToday,
        gigViewsWeek: data.gigAnalytics.viewsWeek,
        gigViewsMonth: data.gigAnalytics.viewsMonth,
        uniqueVisitors: data.gigAnalytics.uniqueVisitors,
        conversionRate: data.gigAnalytics.conversionRate,
        totalWorkHours: data.workAnalytics.totalHours,
        todayWorkHours: data.workAnalytics.todayHours,
        weeklyWorkHours: data.workAnalytics.weeklyHours,
        totalWorkSessions: data.workAnalytics.totalSessions,
        responseRate: data.sellerPerformance.responseRate,
        averageResponseTime: data.sellerPerformance.responseTime,
        completionRate: data.sellerPerformance.completionRate,
        successRate: data.sellerPerformance.successRate,
        online: data.sellerPerformance.online,
        activeOrders: data.sellerPerformance.activeOrders,
        unreadMessages: data.messagingAnalytics.unreadMessages,
        messagesToday: data.messagingAnalytics.messagesToday,
      });
    } catch (err) {
      console.error('Analytics Error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void loadAnalytics();
    });
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-32 rounded-2xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const cards = [
    {
      title: 'Revenue',
      value: `$${analytics.revenue}`,
      icon: DollarSign,
    },
    {
      title: 'Orders',
      value: analytics.totalOrders,
      icon: ShoppingBag,
    },
    {
      title: 'Rating',
      value: analytics.averageRating,
      icon: Star,
    },
    {
      title: 'Visitors',
      value: analytics.uniqueVisitors,
      icon: Users,
    },
  ];

  return (
    <div className="space-y-6">

      {/* TOP CARDS */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm"
            >
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-gray-500">
                    {card.title}
                  </p>

                  <h3 className="text-2xl font-bold mt-2">
                    {card.value}
                  </h3>
                </div>

                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Icon className="text-[#1dbf73]" size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* GIG ANALYTICS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-5">
          Gig Performance
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-gray-500">Today</p>
            <p className="text-3xl font-bold">
              {analytics.gigViewsToday}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Week</p>
            <p className="text-3xl font-bold">
              {analytics.gigViewsWeek}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Month</p>
            <p className="text-3xl font-bold">
              {analytics.gigViewsMonth}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">Visitors</p>
            <p className="text-3xl font-bold">
              {analytics.uniqueVisitors}
            </p>
          </div>
        </div>
      </div>

      {/* CONVERSION */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-5">
          Conversion Analytics
        </h2>

        <div className="flex items-center gap-6">
          <TrendingUp
            className="text-[#1dbf73]"
            size={42}
          />

          <div>
            <p className="text-sm text-gray-500">
              Conversion Rate
            </p>

            <h3 className="text-4xl font-bold">
              {analytics.conversionRate}%
            </h3>
          </div>
        </div>
      </div>

      {/* WORK ANALYTICS */}
      <div className="grid md:grid-cols-4 gap-4">

        <StatCard
          icon={Clock}
          title="Work Hours"
          value={analytics.totalWorkHours}
        />

        <StatCard
          icon={Activity}
          title="Today Hours"
          value={analytics.todayWorkHours}
        />

        <StatCard
          icon={Activity}
          title="Weekly Hours"
          value={analytics.weeklyWorkHours}
        />

        <StatCard
          icon={Clock}
          title="Sessions"
          value={analytics.totalWorkSessions}
        />

      </div>

      {/* PERFORMANCE */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="font-bold text-lg mb-6">
          Seller Performance
        </h2>

        <div className="space-y-5">

          <ProgressRow
            label="Response Rate"
            value={analytics.responseRate}
          />

          <ProgressRow
            label="Completion Rate"
            value={analytics.completionRate}
          />

          <ProgressRow
            label="Success Rate"
            value={analytics.successRate}
          />

        </div>

        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Avg Response Time
          </p>

          <p className="font-bold text-xl">
            {analytics.averageResponseTime}
          </p>
        </div>
      </div>

      {/* LIVE STATUS */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">

        <div className="flex items-center gap-3">

          <div
            className={`w-3 h-3 rounded-full ${
              analytics.online
                ? 'bg-green-500'
                : 'bg-gray-400'
            }`}
          />

          <span className="font-semibold">
            {analytics.online
              ? 'Online'
              : 'Offline'}
          </span>

        </div>

        <div className="grid md:grid-cols-3 gap-4 mt-6">

          <StatCard
            icon={ShoppingBag}
            title="Active Orders"
            value={analytics.activeOrders}
          />

          <StatCard
            icon={Eye}
            title="Messages Today"
            value={analytics.messagesToday}
          />

          <StatCard
            icon={Users}
            title="Unread Messages"
            value={analytics.unreadMessages}
          />

        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <Icon
        size={20}
        className="text-[#1dbf73]"
      />
      <p className="text-xs text-gray-500 mt-2">
        {title}
      </p>
      <p className="text-2xl font-bold">
        {value}
      </p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex justify-between mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>

      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-[#1dbf73]"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}
