const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.trim() ||
  (process.env.VERCEL_ENV === "production"
    ? "https://digiwork-platform-cizx.vercel.app"
    : "http://localhost:5000");

export function apiUrl(path: string): string {
  const normalizedBase = API_URL.replace(/\/$/, "");
  return `${normalizedBase}/${path.replace(/^\//, "")}`;
}

export async function apiFetch(
  path: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(apiUrl(path), { ...init, credentials: "include" });
}

async function jsonRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await apiFetch(path, {
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error((data as { error?: string })?.error || "Request failed");
  }
  return data as T;
}

export interface TrackGigViewPayload {
  gigId: string;
  sellerId?: string;
  country?: string;
  device?: string;
  browser?: string;
}

export function trackGigView(payload: TrackGigViewPayload): Promise<unknown> {
  return jsonRequest("/api/gig-view", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export interface NotificationResponse {
  success: boolean;
  count: number;
  unreadCount: number;
  notifications: Array<Record<string, unknown>>;
}

export function fetchNotifications(): Promise<NotificationResponse> {
  return jsonRequest<NotificationResponse>("/api/notifications", { method: "GET" });
}

export function markNotificationRead(id: string): Promise<unknown> {
  return jsonRequest(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PATCH" });
}

export function markAllNotificationsRead(): Promise<unknown> {
  return jsonRequest("/api/notifications/read-all", { method: "PATCH" });
}

export interface SellerAnalyticsResponse {
  success: boolean;
  gigAnalytics: {
    viewsToday: number;
    viewsWeek: number;
    viewsMonth: number;
    uniqueVisitors: number;
    totalGigs: number;
    totalOrders: number;
    conversionRate: number;
  };
  sellerPerformance: {
    totalOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    activeOrders: number;
    revenue: number;
    averageRating: number;
    responseRate: number;
    responseTime: string;
    completionRate: number;
    successRate: number;
    online: boolean;
  };
  workAnalytics: {
    lastActive: string | null;
    totalSessions: number;
    runningSession: Record<string, unknown> | null;
    totalHours: number;
    todayHours: number;
    weeklyHours: number;
  };
  messagingAnalytics: {
    unreadMessages: number;
    messagesToday: number;
  };
}

export function fetchSellerAnalytics(): Promise<SellerAnalyticsResponse> {
  return jsonRequest<SellerAnalyticsResponse>("/api/analytics/seller", { method: "GET" });
}

export interface GigAnalyticsResponse {
  success: boolean;
  gigAnalytics: Pick<
    SellerAnalyticsResponse['gigAnalytics'],
    'viewsToday' | 'viewsWeek' | 'viewsMonth' | 'uniqueVisitors' | 'totalOrders' | 'conversionRate'
  >;
}

export function fetchGigAnalytics(gigId: string): Promise<GigAnalyticsResponse> {
  return jsonRequest<GigAnalyticsResponse>(`/api/analytics/gig/${encodeURIComponent(gigId)}`, {
    method: "GET",
  });
}

export function startWorkSession(orderId: string): Promise<unknown> {
  return jsonRequest("/api/work/start", { method: "POST", body: JSON.stringify({ orderId }) });
}

export function stopWorkSession(orderId: string): Promise<unknown> {
  return jsonRequest("/api/work/stop", { method: "POST", body: JSON.stringify({ orderId }) });
}

export function fetchWorkSummary(): Promise<unknown> {
  return jsonRequest("/api/work/summary", { method: "GET" });
}
