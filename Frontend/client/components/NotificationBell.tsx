'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, MessageSquare, Package, Star, Zap, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useApp } from '@/context/AppContext';

const typeIcon = (type?: string) => {
  switch (type) {
    case 'message':
      return <MessageSquare size={16} className="text-blue-600" />;
    case 'order':
      return <Package size={16} className="text-emerald-600" />;
    case 'review':
      return <Star size={16} className="text-amber-500" />;
    case 'gig':
      return <Zap size={16} className="text-purple-600" />;
    default:
      return <Bell size={16} className="text-gray-500" />;
  }
};

export const NotificationBell: React.FC = () => {
  const { notifications, unreadNotificationsCount, markNotificationAsRead, clearNotifications } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <Bell size={20} />
        {unreadNotificationsCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[92vw] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">Notifications</p>
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">No notifications yet</p>
            ) : (
              notifications.map((item) => {
                const isUnread = !item.read && !item.isRead;
                const content = (
                  <div
                    className={`flex gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${isUnread ? 'bg-emerald-50/40' : ''}`}
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100">
                      {typeIcon(item.type)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {item.title || item.senderName || 'Notification'}
                      </p>
                      <p className="line-clamp-2 text-xs text-gray-600">{item.message || item.text}</p>
                      {(item.createdAt || item.timestamp) && (
                        <p className="mt-1 text-[11px] text-gray-400">
                          {formatDistanceToNow(new Date(item.createdAt || item.timestamp || Date.now()), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                    {isUnread && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />}
                  </div>
                );

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => markNotificationAsRead(item.id)}
                    className="block w-full border-b border-gray-50 last:border-0"
                  >
                    {item.link ? <Link href={item.link}>{content}</Link> : content}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;