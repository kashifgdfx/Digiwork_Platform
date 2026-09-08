'use client';

import React from 'react';
import { OrderStatus } from '@/types';
import { CheckCircle2, Clock, RotateCcw, Truck } from 'lucide-react';

interface OrderStatusBadgeProps {
  status: OrderStatus;
  size?: 'sm' | 'md';
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const config = {
    in_progress: {
      label: 'In Progress',
      bgColor: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Clock,
    },
    delivered: {
      label: 'Delivered',
      bgColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Truck,
    },
    completed: {
      label: 'Completed',
      bgColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
    },
    revision: {
      label: 'In Revision',
      bgColor: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: RotateCcw,
    },
  };

  const { label, bgColor, icon: Icon } = config[status] || config.in_progress;
  const padding = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${bgColor} ${padding}`}
    >
      <Icon size={size === 'sm' ? 12 : 14} />
      <span>{label}</span>
    </span>
  );
};
