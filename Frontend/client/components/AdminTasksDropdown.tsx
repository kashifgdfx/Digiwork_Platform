"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BriefcaseBusiness, ChevronDown, Package, UserRound, UserShield } from "lucide-react";
import { apiFetch } from "@/lib/api";

type AdminTask = {
  id: string;
  type: "gig" | "order" | "user";
  title: string;
  description: string;
  createdAt?: string;
  href: string;
};

type AdminTaskRecord = Record<string, unknown>;

const asRecord = (value: unknown): AdminTaskRecord | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value as AdminTaskRecord
    : null;

const normalizeAdminTasks = (payload: unknown): AdminTask[] => {
  const root = asRecord(payload);
  const nestedData = root ? asRecord(root.data) : null;
  const source = root?.items
    ?? root?.pendingItems
    ?? root?.notifications
    ?? root?.results
    ?? nestedData?.items
    ?? nestedData?.pendingItems
    ?? root?.data
    ?? payload;
  const sourceRecord = asRecord(source);
  const entries: Array<{ value: unknown; fallbackType?: AdminTask["type"] }> = Array.isArray(source)
    ? source.map((value) => ({ value }))
    : sourceRecord && (sourceRecord.id || sourceRecord._id || sourceRecord.title)
      ? [{ value: sourceRecord }]
      : sourceRecord
        ? Object.entries(sourceRecord).flatMap(([key, group]) => {
            const keyName = key.toLowerCase();
            const fallbackType: AdminTask["type"] | undefined = keyName.includes("gig")
              ? "gig"
              : keyName.includes("order")
                ? "order"
                : keyName.includes("user") || keyName.includes("signup")
                  ? "user"
                  : undefined;
            const values = Array.isArray(group) ? group : asRecord(group) ? [group] : [];
            return values.map((value) => ({ value, fallbackType }));
          })
        : Array.isArray(nestedData)
          ? nestedData.map((value) => ({ value }))
          : [];

  return entries.flatMap(({ value, fallbackType }, index) => {
    const item = asRecord(value);
    if (!item) return [];
    const rawType = String(item.type ?? fallbackType ?? "").toLowerCase();
    const type: AdminTask["type"] = rawType.includes("gig")
      ? "gig"
      : rawType.includes("order")
        ? "order"
        : "user";
    const id = String(item.id ?? item._id ?? `${type}-${index}`);
    const title = String(item.title ?? (type === "gig" ? "Gig awaiting moderation" : type === "order" ? "New order placed" : "New user signup"));
    const description = String(item.description ?? item.message ?? item.details ?? item.email ?? "Review this item in the admin dashboard.");
    const href = String(item.href ?? (type === "gig" ? "/admin/dashboard?tab=gigs" : type === "order" ? "/admin/dashboard?tab=orders" : "/admin/dashboard?tab=users"));
    const createdAt = item.createdAt ?? item.timestamp;

    return [{
      id,
      type,
      title,
      description,
      createdAt: typeof createdAt === "string" ? createdAt : undefined,
      href,
    }];
  });
};

type AdminTasksDropdownProps = {
  count: number;
  displayCount: number | string;
  className?: string;
  mobile?: boolean;
  onNavigate?: () => void;
};

const taskIcon = (type: AdminTask["type"]) => {
  if (type === "gig") return <BriefcaseBusiness size={16} className="text-purple-600" />;
  if (type === "order") return <Package size={16} className="text-emerald-600" />;
  return <UserRound size={16} className="text-blue-600" />;
};

export const AdminTasksDropdown: React.FC<AdminTasksDropdownProps> = ({
  count: initialCount,
  displayCount: initialDisplayCount,
  className = "",
  mobile = false,
  onNavigate,
}) => {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AdminTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [currentCount, setCurrentCount] = useState<number>(initialCount);
  const ref = useRef<HTMLDivElement>(null);

  // Sync count prop changes
  useEffect(() => {
    setCurrentCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setLoadError("");
    apiFetch("/api/admin/pending-items")
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.error || `Admin items request failed (${response.status})`);
        }
        if (active) setItems(normalizeAdminTasks(data));
      })
      .catch((error) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Unable to load pending admin items");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  // Handle item click / mark as read
  const handleItemClick = async (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    try {
      await apiFetch(`/api/admin/pending-items/${encodeURIComponent(itemId)}/read`, {
        method: "PATCH",
      });
      // State se item hatao aur count update karo
      setItems((prev) => prev.filter((item) => item.id !== itemId));
      setCurrentCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark item as read", error);
    }
  };

  const displayCountVal = currentCount > 99 ? "99+" : currentCount;

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((previous) => !previous)}
        className={mobile
          ? "flex w-full items-center gap-2 py-2 text-left text-sm font-medium text-gray-700 hover:text-[#1dbf73]"
          : "inline-flex items-center gap-2 rounded-md border border-[#1DBF73] bg-[#1DBF73] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#19a463]"
        }
      >
        <UserShield size={16} className="shrink-0" />
        <span className="whitespace-nowrap">Admin Panel</span>
        {currentCount > 0 && (
          <span className={mobile
            ? "inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-[#1dbf73] px-1 text-[10px] font-bold text-white"
            : "inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-bold text-[#168f58]"
          }>
            {displayCountVal}
          </span>
        )}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pending admin tasks"
          className="fixed left-1/2 top-16 z-[9999] w-[95vw] max-w-sm -translate-x-1/2 overflow-hidden rounded-xl border border-gray-200 bg-white text-left shadow-xl md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-80 md:translate-x-0"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Pending admin tasks</p>
            {currentCount > 0 && <span className="text-xs font-medium text-gray-500">{currentCount} total</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Loading pending tasks…</p>
            ) : loadError ? (
              <p className="px-4 py-8 text-center text-sm text-rose-600">{loadError}</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No pending admin tasks</p>
            ) : items.map((item) => (
              <div
                key={item.id}
                onClick={(e) => handleItemClick(item.id, e)}
                className="flex cursor-pointer gap-3 border-b border-gray-50 px-4 py-3 transition-colors last:border-0 hover:bg-gray-50"
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                  {taskIcon(item.type)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-gray-900">{item.title}</span>
                  <span className="mt-0.5 line-clamp-2 block text-xs text-gray-600">{item.description}</span>
                  {item.createdAt && !Number.isNaN(new Date(item.createdAt).getTime()) && (
                    <span className="mt-1 block text-[11px] text-gray-400">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
          <Link
            href="/admin/dashboard"
            onClick={() => {
              setOpen(false);
              onNavigate?.();
            }}
            className="block border-t border-gray-100 px-4 py-3 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Open Admin Dashboard
          </Link>
        </div>
      )}
    </div>
  );
};

export default AdminTasksDropdown;