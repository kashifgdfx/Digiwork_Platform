"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  BriefcaseBusiness,
  IndianRupee,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Users,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { apiFetch } from "@/lib/api";

type Tab = "overview" | "users" | "orders" | "gigs";

type AdminUser = {
  id: string;
  name: string;
  username: string;
  email: string;
  role: "buyer" | "seller" | "admin";
  accountStatus?: "active" | "declined" | "suspended";
  createdAt?: string;
};

type AdminOrder = {
  id: string;
  gigTitle: string;
  buyerName: string;
  sellerName: string;
  price: number;
  status: string;
  createdAt?: string;
};

type AdminGig = {
  id: string;
  title: string;
  sellerId: string;
  startingPrice: number;
  moderationStatus?: "pending" | "approved" | "rejected";
  moderationNote?: string;
  createdAt?: string;
};

type Stats = {
  totalUsers: number;
  activeUsers: number;
  activeGigs: number;
  completedOrders: number;
  totalOrders: number;
  revenue: number;
  recentActivity: Array<{
    _id: string;
    action: string;
    details?: string;
    createdAt: string;
  }>;
  growth: Array<{ _id: string; users: number }>;
};

const statusOptions = [
  "pending",
  "in_progress",
  "delivered",
  "completed",
  "cancelled",
  "revision",
];

export default function AdminDashboard() {
  const router = useRouter();
  const { currentUser, isAuthLoading, refreshCurrentUser } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [gigs, setGigs] = useState<AdminGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [hoveredPoint, setHoveredPoint] = useState<{ date: string; users: number } | null>(null);

  const request = useCallback(async (path: string, init?: RequestInit) => {
    const response = await apiFetch(path, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || "Request failed");
    return body;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    try {
      const [statsData, usersData, ordersData, gigsData] = await Promise.all([
        request("/api/admin/stats"),
        request("/api/admin/users"),
        request("/api/admin/orders"),
        request("/api/admin/gigs"),
      ]);
      setStats(statsData.stats);
      setUsers(usersData.users || []);
      setOrders(ordersData.orders || []);
      setGigs(gigsData.gigs || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to load the dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser) {
      refreshCurrentUser();
      return;
    }
    if (currentUser.role !== "admin") {
      router.replace("/");
      return;
    }
    load();
  }, [currentUser, isAuthLoading, load, refreshCurrentUser, router]);

  const mutate = async (path: string, init: RequestInit) => {
    try {
      await request(path, init);
      await load();
      setMessage("Changes saved successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed");
    }
  };

  if (isAuthLoading || !currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm font-medium text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-[#1dbf73] border-t-transparent rounded-full animate-spin"></div>
          Checking administrator access...
        </div>
      </div>
    );
  }

  const cards = [
    [
      "Total Users",
      stats?.totalUsers || 0,
      Users,
      "text-emerald-600 bg-emerald-50/80 border-emerald-100",
    ],
    [
      "Active Gigs",
      stats?.activeGigs || 0,
      BriefcaseBusiness,
      "text-blue-600 bg-blue-50/80 border-blue-100",
    ],
    [
      "Completed Orders",
      stats?.completedOrders || 0,
      ShoppingBag,
      "text-amber-600 bg-amber-50/80 border-amber-100",
    ],
    [
      "Total Revenue",
      `₹${(stats?.revenue || 0).toLocaleString()}`,
      IndianRupee,
      "text-purple-600 bg-purple-50/80 border-purple-100",
    ],
  ] as const;

  return (
    <main className="min-h-screen bg-gray-50/60 pb-16 pt-8 px-4 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center bg-white p-6 rounded-2xl border border-gray-200/60 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-[#1dbf73] text-xs font-semibold mb-2 border border-emerald-100">
              <ShieldCheck size={14} />
              Platform Control Center
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Seamlessly monitor marketplace activity, handle moderation, and manage users.
            </p>
          </div>
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-[#1dbf73] border border-emerald-100 shadow-2xs">
            <ShieldCheck size={26} />
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 overflow-x-auto border-b border-gray-200/80 pb-px">
          {(["overview", "users", "orders", "gigs"] as Tab[]).map((item) => {
            const isActive = tab === item;
            return (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`whitespace-nowrap px-5 py-3 text-sm font-semibold capitalize transition-all duration-200 border-b-2 rounded-t-lg ${
                  isActive
                    ? "border-[#1dbf73] text-[#1dbf73] bg-white shadow-2xs"
                    : "border-transparent text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                }`}
              >
                {item === "gigs" ? "Gig Moderation" : item}
              </button>
            );
          })}
        </div>

        {/* Alert Feedback Message */}
        {message && (
          <div className="flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-4 py-3.5 text-sm text-gray-700 shadow-2xs">
            <AlertCircle size={18} className="text-[#1dbf73] shrink-0" />
            <span className="font-medium">{message}</span>
          </div>
        )}

        {/* Loading Skeleton */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xs animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-3 w-20 bg-gray-100 rounded"></div>
                    <div className="h-10 w-10 bg-gray-100 rounded-xl"></div>
                  </div>
                  <div className="mt-4 h-8 w-24 bg-gray-100 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Overview Tab */}
            {tab === "overview" && (
              <div className="space-y-6">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {cards.map(([label, value, Icon, color]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xs transition-all hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                          {label}
                        </p>
                        <span className={`rounded-xl p-2.5 border ${color}`}>
                          <Icon size={20} />
                        </span>
                      </div>
                      <p className="mt-4 text-3xl font-black text-gray-900 tracking-tight">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Interactive Analytics Growth Chart */}
                  <section className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="flex items-center gap-2 font-bold text-gray-900 text-base">
                          <TrendingUp size={18} className="text-[#1dbf73]" /> 
                          30-Day User Growth Analytics
                        </h2>
                        {hoveredPoint && (
                          <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-[#1dbf73] rounded-md border border-emerald-100">
                            {hoveredPoint.date}: <strong className="font-bold">{hoveredPoint.users}</strong> users
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400">Hover over bars to check date-wise metrics</p>
                    </div>

                    <div className="mt-6 flex h-44 items-end gap-1.5 pt-6 border-b border-gray-100 pb-2 relative">
                      {stats?.growth?.length ? (
                        stats.growth.map((point) => {
                          const maxUsers = Math.max(...stats.growth.map((x) => x.users), 1);
                          const heightPercent = Math.max(10, (point.users / maxUsers) * 100);
                          return (
                            <div
                              key={point._id}
                              onMouseEnter={() => setHoveredPoint({ date: point._id, users: point.users })}
                              onMouseLeave={() => setHoveredPoint(null)}
                              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                            >
                              <div
                                className="w-full rounded-t-md bg-gradient-to-t from-emerald-500 to-[#1dbf73] transition-all duration-200 group-hover:bg-emerald-600 group-hover:shadow-sm"
                                style={{ height: `${heightPercent}%` }}
                              />
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-400 italic w-full text-center my-auto">
                          No new user metrics found in the last 30 days.
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs text-gray-400 font-medium px-1">
                      <span>30 Days Ago</span>
                      <span>Today</span>
                    </div>
                  </section>

                  {/* Recent Activity Section */}
                  <section className="rounded-2xl border border-gray-200/60 bg-white p-6 shadow-2xs">
                    <h2 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                      <Activity size={18} className="text-gray-500" />
                      Recent System Activity
                    </h2>
                    <div className="space-y-4 max-h-[235px] overflow-y-auto pr-2">
                      {stats?.recentActivity?.length ? (
                        stats.recentActivity.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-start justify-between border-b border-gray-50 pb-3 text-sm"
                          >
                            <div>
                              <p className="font-semibold text-gray-800">
                                {item.action}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {item.details || new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No recent logs recorded yet.
                        </p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            )}

            {/* Users Tab */}
            {tab === "users" && (
              <section className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-200/60">
                      <tr>
                        <th className="p-4.5">User Details</th>
                        <th className="p-4.5">Role</th>
                        <th className="p-4.5">Account Status</th>
                        <th className="p-4.5">Joined Date</th>
                        <th className="p-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4.5">
                            <p className="font-bold text-gray-900">{user.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {user.email} · <span className="text-gray-500 font-medium">@{user.username}</span>
                            </p>
                          </td>
                          <td className="p-4.5">
                            <select
                              value={user.role}
                              onChange={(e) =>
                                mutate(`/api/admin/users/${user.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ role: e.target.value }),
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs focus:outline-emerald-500"
                            >
                              {["buyer", "seller", "admin"].map((role) => (
                                <option key={role} value={role}>{role.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4.5">
                            <select
                              value={user.accountStatus || "active"}
                              onChange={(e) =>
                                mutate(`/api/admin/users/${user.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ accountStatus: e.target.value }),
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs focus:outline-emerald-500"
                            >
                              {["active", "declined", "suspended"].map((status) => (
                                <option key={status} value={status}>{status.toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-4.5 text-gray-500 text-xs font-medium">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="p-4.5 text-right">
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete user ${user.name}?`))
                                  mutate(`/api/admin/users/${user.id}`, { method: "DELETE" });
                              }}
                              className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                              title="Delete user"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Orders Tab */}
            {tab === "orders" && (
              <section className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-200/60">
                      <tr>
                        <th className="p-4.5">Order Title</th>
                        <th className="p-4.5">Buyer / Seller</th>
                        <th className="p-4.5">Value</th>
                        <th className="p-4.5">Status Lifecycle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4.5 font-bold text-gray-900">{order.gigTitle}</td>
                          <td className="p-4.5 text-gray-500 text-xs font-medium">
                            <span className="text-gray-800 font-semibold">{order.buyerName}</span> / <span className="text-gray-800 font-semibold">{order.sellerName}</span>
                          </td>
                          <td className="p-4.5 font-bold text-emerald-600">₹{order.price}</td>
                          <td className="p-4.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                mutate(`/api/admin/orders/${order.id}`, {
                                  method: "PATCH",
                                  body: JSON.stringify({ status: e.target.value }),
                                })
                              }
                              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-2xs focus:outline-emerald-500"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>{status.replace("_", " ").toUpperCase()}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Gigs Moderation Tab */}
            {tab === "gigs" && (
              <section className="overflow-hidden rounded-2xl border border-gray-200/60 bg-white shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-sm">
                    <thead className="bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-200/60">
                      <tr>
                        <th className="p-4.5">Gig Title</th>
                        <th className="p-4.5">Seller ID</th>
                        <th className="p-4.5">Starting Price</th>
                        <th className="p-4.5">Moderation State</th>
                        <th className="p-4.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {gigs.map((gig) => {
                        const status = gig.moderationStatus || "approved";
                        return (
                          <tr key={gig.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="p-4.5 font-bold text-gray-900 max-w-xs truncate">{gig.title}</td>
                            <td className="p-4.5 text-xs text-gray-500 font-mono">{gig.sellerId}</td>
                            <td className="p-4.5 font-semibold text-gray-800">₹{gig.startingPrice}</td>
                            <td className="p-4.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                  status === "approved"
                                    ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                                    : status === "rejected"
                                    ? "bg-red-50 text-red-600 border border-red-100"
                                    : "bg-amber-50 text-amber-600 border border-amber-100"
                                }`}
                              >
                                {status === "approved" && <CheckCircle2 size={12} />}
                                {status === "rejected" && <XCircle size={12} />}
                                {status === "pending" && <AlertCircle size={12} />}
                                {status}
                              </span>
                            </td>
                            <td className="p-4.5 text-right space-x-2">
                              <button
                                onClick={() =>
                                  mutate(`/api/admin/gigs/${gig.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ moderationStatus: "approved" }),
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  mutate(`/api/admin/gigs/${gig.id}`, {
                                    method: "PATCH",
                                    body: JSON.stringify({ moderationStatus: "rejected" }),
                                  })
                                }
                                className="inline-flex items-center gap-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
                              >
                                Reject
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Delete gig "${gig.title}"?`))
                                    mutate(`/api/admin/gigs/${gig.id}`, { method: "DELETE" });
                                }}
                                className="inline-flex items-center justify-center p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete gig"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}