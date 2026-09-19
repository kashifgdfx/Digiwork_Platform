"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  DollarSign,
  MessageCircle,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  type AnalyticsRange,
  type SellerAnalyticsHistoryPoint,
  fetchSellerAnalytics,
  fetchSellerAnalyticsHistory,
} from "@/lib/api";

type Granularity = "daily" | "weekly" | "monthly";
const emerald = "#10b981";
const blue = "#3b82f6";
const violet = "#8b5cf6";
const amber = "#f59e0b";
const rose = "#f43f5e";
const rangeOptions: Array<[AnalyticsRange, string]> = [
  ["today", "Today"],
  ["yesterday", "Yesterday"],
  ["7d", "Last 7 Days"],
  ["30d", "Last 30 Days"],
  ["90d", "Last 90 Days"],
  ["month", "This Month"],
  ["custom", "Custom Range"],
];
const controlClass =
  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium outline-none ring-emerald-500 focus:ring-2 dark:border-slate-700 dark:bg-slate-900";
const fmt = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);
const dateLabel = (date: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(
    new Date(`${date.slice(0, 10)}T00:00:00`),
  );
const total = (
  data: SellerAnalyticsHistoryPoint[],
  field: keyof SellerAnalyticsHistoryPoint,
) => data.reduce((sum, item) => sum + (Number(item[field]) || 0), 0);
const percentTrend = (
  data: SellerAnalyticsHistoryPoint[],
  field: keyof SellerAnalyticsHistoryPoint,
) => {
  const half = Math.ceil(data.length / 2);
  const before = total(data.slice(0, half), field);
  const after = total(data.slice(half), field);
  return before
    ? Math.round(((after - before) / before) * 100)
    : after
      ? 100
      : 0;
};

function grouped(data: SellerAnalyticsHistoryPoint[], mode: Granularity) {
  const result = new Map<string, SellerAnalyticsHistoryPoint>();
  data.forEach((item) => {
    const date = new Date(`${item.date}T00:00:00`);
    const key =
      mode === "daily"
        ? item.date
        : mode === "monthly"
          ? item.date.slice(0, 7)
          : `${date.getFullYear()}-W${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
    const old = result.get(key);
    if (!old) return void result.set(key, { ...item, date: key });
    (Object.keys(item) as Array<keyof SellerAnalyticsHistoryPoint>).forEach(
      (field) => {
        if (field !== "date" && field !== "rating")
          (old[field] as number) += Number(item[field]) || 0;
      },
    );
    old.rating = item.rating || old.rating;
  });
  return [...result.values()];
}

export function SellerAnalyticsPanel() {
  const [range, setRange] = useState<AnalyticsRange>("30d");
  const [granularity, setGranularity] = useState<Granularity>("daily");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [history, setHistory] = useState<SellerAnalyticsHistoryPoint[]>([]);
  const [monthHistory, setMonthHistory] = useState<
    SellerAnalyticsHistoryPoint[]
  >([]);
  const [snapshot, setSnapshot] = useState<Awaited<
    ReturnType<typeof fetchSellerAnalytics>
  > | null>(null);
  const [funnel, setFunnel] = useState({
    visitors: 0,
    views: 0,
    clicks: 0,
    messages: 0,
    orders: 0,
  });
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const selected = await fetchSellerAnalyticsHistory(range, custom);
      const [summary, monthly] = await Promise.all([
        fetchSellerAnalytics(),
        range === "30d"
          ? Promise.resolve(selected)
          : fetchSellerAnalyticsHistory("30d"),
      ]);
      setSnapshot(summary);
      setHistory(selected.history);
      setMonthHistory(monthly.history);
      setFunnel(selected.funnel);
      setActiveVisitors(selected.live.activeVisitors);
    } catch (error) {
      console.error("Analytics Error:", error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, [range, custom.start, custom.end]);
  useEffect(() => {
    const timer = window.setInterval(() => void load(), 15000);
    return () => window.clearInterval(timer);
  }, [range, custom.start, custom.end]);
  const chartData = useMemo(
    () => grouped(history, granularity),
    [history, granularity],
  );
  const revenueSummary = useMemo(() => {
    const today = new Date().toLocaleDateString("en-CA");
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const current =
      monthHistory.find((item) => item.date === today)?.revenue || 0;
    const previous =
      monthHistory.find(
        (item) => item.date === yesterday.toLocaleDateString("en-CA"),
      )?.revenue || 0;
    return {
      current,
      previous,
      week: total(monthHistory.slice(-7), "revenue"),
      month: total(monthHistory, "revenue"),
      growth: previous
        ? Math.round(((current - previous) / previous) * 100)
        : current
          ? 100
          : 0,
    };
  }, [monthHistory]);
  if (loading && !snapshot) return <Skeleton />;
  if (!snapshot) return null;

  const kpis: Array<{
    title: string;
    value: string | number;
    trend: number;
    icon: LucideIcon;
    color: string;
    field: keyof SellerAnalyticsHistoryPoint;
  }> = [
    {
      title: "Revenue",
      value: fmt(snapshot.sellerPerformance.revenue),
      trend: percentTrend(history, "revenue"),
      icon: DollarSign,
      color: emerald,
      field: "revenue",
    },
    {
      title: "Total orders",
      value: snapshot.sellerPerformance.totalOrders,
      trend: percentTrend(history, "orders"),
      icon: ShoppingBag,
      color: blue,
      field: "orders",
    },
    {
      title: "Completed orders",
      value: snapshot.sellerPerformance.completedOrders,
      trend: percentTrend(history, "completedOrders"),
      icon: CheckCircle2,
      color: violet,
      field: "completedOrders",
    },
    {
      title: "Average rating",
      value: snapshot.sellerPerformance.averageRating.toFixed(1),
      trend: percentTrend(history, "rating"),
      icon: Star,
      color: amber,
      field: "rating",
    },
    {
      title: "Visitors",
      value: snapshot.gigAnalytics.uniqueVisitors,
      trend: percentTrend(history, "visitors"),
      icon: Users,
      color: rose,
      field: "visitors",
    },
    {
      title: "Conversion rate",
      value: `${snapshot.gigAnalytics.conversionRate}%`,
      trend: percentTrend(history, "orders"),
      icon: TrendingUp,
      color: emerald,
      field: "orders",
    },
  ];
  const stages = [
    ["Visitors", funnel.visitors, blue],
    ["Gig views", funnel.views, violet],
    ["Tracked clicks", funnel.clicks, amber],
    ["Messages", funnel.messages, rose],
    ["Orders", funnel.orders, emerald],
  ] as const;

  return (
    <section className="space-y-6 text-slate-900 dark:text-slate-100">
      <header className="rounded-3xl border border-slate-200 bg-linear-to-br from-white to-emerald-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-emerald-950/30 sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">
              Seller intelligence
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Performance analytics
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Live database insights for your gigs, orders, work, and customers.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={range}
              aria-label="Date range"
              onChange={(e) => setRange(e.target.value as AnalyticsRange)}
              className={controlClass}
            >
              {rangeOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={granularity}
              aria-label="Chart grouping"
              onChange={(e) => setGranularity(e.target.value as Granularity)}
              className={controlClass}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
        {range === "custom" && (
          <div className="mt-4 flex flex-wrap gap-3">
            <input
              className={controlClass}
              aria-label="Start date"
              type="date"
              value={custom.start}
              onChange={(e) =>
                setCustom((v) => ({ ...v, start: e.target.value }))
              }
            />
            <input
              className={controlClass}
              aria-label="End date"
              type="date"
              value={custom.end}
              onChange={(e) =>
                setCustom((v) => ({ ...v, end: e.target.value }))
              }
            />
          </div>
        )}
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((item) => (
          <Kpi key={item.title} {...item} history={history} />
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Summary title="Today's revenue" value={fmt(revenueSummary.current)} />
        <Summary
          title="Yesterday revenue"
          value={fmt(revenueSummary.previous)}
        />
        <Summary title="Weekly revenue" value={fmt(revenueSummary.week)} />
        <Summary title="Monthly revenue" value={fmt(revenueSummary.month)} />
        <Summary
          title="Revenue growth"
          value={`${revenueSummary.growth >= 0 ? "+" : ""}${revenueSummary.growth}%`}
          colored={revenueSummary.growth >= 0}
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Revenue analytics" subtitle="Completed-order revenue">
          <ResponsiveContainer width="100%" height={290}>
            <AreaChart data={chartData}>
              <Grid />
              <XAxis dataKey="date" tickFormatter={dateLabel} />
              <YAxis tickFormatter={(v) => `₹${v}`} />
              <Tooltip content={<Tip money />} />
              <Area
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke={emerald}
                fill={emerald}
                fillOpacity={0.22}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
        <Card
          title="Orders analytics"
          subtitle="Completed versus pending / active"
        >
          <ResponsiveContainer width="100%" height={290}>
            <BarChart data={chartData}>
              <Grid />
              <XAxis dataKey="date" tickFormatter={dateLabel} />
              <YAxis allowDecimals={false} />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar
                dataKey="completedOrders"
                name="Completed"
                stackId="a"
                fill={emerald}
                radius={[5, 5, 0, 0]}
              />
              <Bar
                dataKey="pendingOrders"
                name="Pending / active"
                stackId="a"
                fill={amber}
                radius={[5, 5, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <Card
        title="Gig performance"
        subtitle="Views, unique visitors, mouse activity, and keyboard activity"
      >
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <Grid />
            <XAxis dataKey="date" tickFormatter={dateLabel} />
            <YAxis />
            <Tooltip content={<Tip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="views"
              name="Gig views"
              stroke={blue}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="visitors"
              name="Unique visitors"
              stroke={violet}
              strokeWidth={2.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="mouseMoves"
              name="Mouse activity"
              stroke={amber}
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="keyPresses"
              name="Keyboard activity"
              stroke={rose}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card
          title="Conversion funnel"
          subtitle="Live tracked event progression"
          className="xl:col-span-2"
        >
          <div className="space-y-4">
            {stages.map(([label, value, color], index) => {
              const prior = stages[index - 1]?.[1] || value;
              const conversion = prior ? Math.round((value / prior) * 100) : 0;
              return (
                <div key={label}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{label}</span>
                    <span className="text-slate-500">
                      {value} {index > 0 && `· ${conversion}%`}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.max(4, funnel.visitors ? (value / funnel.visitors) * 100 : 0)}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
        <Card
          title="Work analytics"
          subtitle="Hours and session count"
          className="xl:col-span-3"
        >
          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={chartData}>
              <Grid />
              <XAxis dataKey="date" tickFormatter={dateLabel} />
              <YAxis yAxisId="hours" />
              <YAxis yAxisId="sessions" orientation="right" />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar
                yAxisId="hours"
                dataKey="hours"
                name="Hours"
                fill={violet}
                radius={[5, 5, 0, 0]}
              />
              <Area
                yAxisId="sessions"
                type="monotone"
                dataKey="sessions"
                name="Sessions"
                stroke={emerald}
                fill={emerald}
                fillOpacity={0.16}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-5">
        <Card
          title="Seller performance"
          subtitle={`Average response time: ${snapshot.sellerPerformance.responseTime}`}
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-3 gap-2">
            <Radial
              value={snapshot.sellerPerformance.responseRate}
              label="Response"
            />
            <Radial
              value={snapshot.sellerPerformance.completionRate}
              label="Completion"
            />
            <Radial
              value={snapshot.sellerPerformance.successRate}
              label="Success"
            />
          </div>
          <p className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-500 dark:border-slate-800">
            Average rating{" "}
            <span className="float-right font-bold text-slate-900 dark:text-white">
              {snapshot.sellerPerformance.averageRating.toFixed(1)} / 5
            </span>
          </p>
        </Card>
        <Card
          title="Messaging analytics"
          subtitle="Messages and unread volume by day"
          className="xl:col-span-3"
        >
          <ResponsiveContainer width="100%" height={270}>
            <ComposedChart data={chartData}>
              <Grid />
              <XAxis dataKey="date" tickFormatter={dateLabel} />
              <YAxis />
              <Tooltip content={<Tip />} />
              <Legend />
              <Bar
                dataKey="messages"
                name="Messages"
                fill={blue}
                radius={[5, 5, 0, 0]}
              />
              <Line
                type="monotone"
                dataKey="unreadMessages"
                name="Unread"
                stroke={rose}
                strokeWidth={3}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Live
          icon={snapshot.sellerPerformance.online ? Activity : Clock}
          title="Seller status"
          value={snapshot.sellerPerformance.online ? "Online" : "Offline"}
        />
        <Live
          icon={ShoppingBag}
          title="Active orders"
          value={snapshot.sellerPerformance.activeOrders}
        />
        <Live icon={Users} title="Visitors active now" value={activeVisitors} />
        <Live
          icon={MessageCircle}
          title="Unread messages"
          value={snapshot.messagingAnalytics.unreadMessages}
        />
      </div>
    </section>
  );
}

function Kpi({
  title,
  value,
  trend,
  icon: Icon,
  color,
  field,
  history,
}: {
  title: string;
  value: string | number;
  trend: number;
  icon: LucideIcon;
  color: string;
  field: keyof SellerAnalyticsHistoryPoint;
  history: SellerAnalyticsHistoryPoint[];
}) {
  const up = trend >= 0;
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-950">
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p
            className={`mt-2 flex items-center gap-1 text-xs font-semibold ${up ? "text-emerald-600" : "text-rose-600"}`}
          >
            {up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {up ? "+" : ""}
            {trend}%{" "}
            <span className="font-normal text-slate-400">vs earlier</span>
          </p>
        </div>
        <span
          className="rounded-xl p-3"
          style={{ color, backgroundColor: `${color}18` }}
        >
          <Icon size={20} />
        </span>
      </div>
      <div className="mt-3 h-12">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={history.map((item) => ({ value: Number(item[field]) || 0 }))}
          >
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
function Summary({
  title,
  value,
  colored,
}: {
  title: string;
  value: string;
  colored?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <p className="text-xs font-medium text-slate-500">{title}</p>
      <p
        className={`mt-2 text-xl font-bold ${colored === undefined ? "" : colored ? "text-emerald-600" : "text-rose-600"}`}
      >
        {value}
      </p>
    </div>
  );
}
function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:p-6 ${className}`}
    >
      <h3 className="font-bold">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {subtitle}
      </p>
      <div className="mt-5">{children}</div>
    </article>
  );
}
function Grid() {
  return (
    <CartesianGrid
      strokeDasharray="3 3"
      vertical={false}
      className="text-slate-200 dark:text-slate-800"
    />
  );
}
function Tip({
  active,
  payload,
  label,
  money: isMoney,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl dark:border-slate-700 dark:bg-slate-900">
      <p className="mb-1 font-semibold">{label && dateLabel(label)}</p>
      {payload.map((item) => (
        <p key={item.name} style={{ color: item.color }}>
          {item.name}: {isMoney ? fmt(item.value) : item.value}
        </p>
      ))}
    </div>
  );
}
function Radial({ value, label }: { value: number; label: string }) {
  const safe = Math.max(0, Math.min(100, value));
  return (
    <div className="text-center">
      <ResponsiveContainer width="100%" height={104}>
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
          data={[{ value: safe, fill: emerald }]}
        >
          <RadialBar background dataKey="value" cornerRadius={8} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="-mt-14 text-lg font-bold">{safe}%</p>
      <p className="mt-8 text-xs text-slate-500">{label}</p>
    </div>
  );
}
function Live({
  icon: Icon,
  title,
  value,
}: {
  icon: LucideIcon;
  title: string;
  value: string | number;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <Icon size={20} className="text-emerald-500" />
      <p className="mt-3 text-xs font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className="mt-2 text-xs text-slate-400">Refreshes every 15 seconds</p>
    </article>
  );
}
function Skeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 animate-pulse rounded-3xl bg-slate-100 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-44 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800"
          />
        ))}
      </div>
    </div>
  );
}
