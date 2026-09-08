'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Gig, PackageTier } from '@/types';
import { useApp } from '@/context/AppContext';
import {
  CheckCircle2,
  Clock,
  CreditCard,
  Lock,
  RotateCcw,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';

interface CheckoutModalProps {
  gig: Gig;
  packageTier: PackageTier;
  isOpen: boolean;
  onClose: () => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  gig,
  packageTier,
  isOpen,
  onClose,
}) => {
  const { placeOrder } = useApp();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'balance'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  if (!isOpen) return null;

  const subtotal = packageTier.price;
  const serviceFee = Math.max(3, Math.round(subtotal * 0.055 * 100) / 100);
  const total = (subtotal + serviceFee).toFixed(2);

  const handlePlaceOrder = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const order = placeOrder(gig, packageTier.name);
      setPlacedOrderId(order.id);
      setIsSubmitting(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100 my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {placedOrderId ? (
          /* Success Screen */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-[#1dbf73] rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Order Placed Successfully!</h3>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              Your order <span className="font-semibold text-gray-900">#{placedOrderId}</span> has been dispatched to{' '}
              <span className="font-semibold text-[#1dbf73]">{gig.seller.name}</span>. The seller has been notified and work will commence shortly.
            </p>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left max-w-md mx-auto text-xs text-gray-600 space-y-1.5">
              <div className="flex justify-between">
                <span>Gig:</span>
                <span className="font-semibold text-gray-800 truncate max-w-[200px]">{gig.title}</span>
              </div>
              <div className="flex justify-between">
                <span>Package:</span>
                <span className="font-semibold text-gray-800">{packageTier.name} (${packageTier.price})</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Delivery:</span>
                <span className="font-semibold text-gray-800">{packageTier.deliveryDays} Days</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard/buyer"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#1dbf73] hover:bg-[#19a463] text-white font-semibold text-sm rounded-lg transition-colors shadow-sm"
              >
                Track in Buyer Dashboard
              </Link>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-lg transition-colors"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        ) : (
          /* Order Checkout Form */
          <div>
            <div className="flex items-center gap-2 mb-4 text-[#1dbf73] font-bold text-sm">
              <ShieldCheck size={18} />
              <span>Secure SSL Checkout</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h3>

            {/* Gig & Tier Brief */}
            <div className="flex gap-4 p-3.5 bg-gray-50 rounded-xl border border-gray-100 mb-6">
              <img
                src={gig.images[0]}
                alt={gig.title}
                className="w-20 h-16 object-cover rounded-lg shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-gray-900 line-clamp-1">{gig.title}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                  <span className="font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {packageTier.name} Package
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {packageTier.deliveryDays} Days
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <RotateCcw size={12} /> {packageTier.revisions} Rev
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Tabs */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Payment Option
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'card'
                      ? 'border-[#1dbf73] bg-emerald-50 text-[#1dbf73]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <CreditCard size={14} />
                  <span>Card</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('paypal')}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'paypal'
                      ? 'border-[#1dbf73] bg-emerald-50 text-[#1dbf73]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span>PayPal</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('balance')}
                  className={`py-2 px-3 border rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    paymentMethod === 'balance'
                      ? 'border-[#1dbf73] bg-emerald-50 text-[#1dbf73]'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <Wallet size={14} />
                  <span>Balance ($500)</span>
                </button>
              </div>
            </div>

            {/* Card Simulation Inputs */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 mb-6 bg-gray-50/70 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                    Card Number
                  </label>
                  <input
                    type="text"
                    defaultValue="4242 •••• •••• 4242"
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="text"
                      defaultValue="12/28"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                      Security Code (CVC)
                    </label>
                    <input
                      type="text"
                      defaultValue="982"
                      className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white text-gray-800 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Cost Breakdown */}
            <div className="space-y-2 border-t border-gray-200 pt-4 mb-6 text-sm">
              <div className="flex justify-between text-gray-600 text-xs">
                <span>{packageTier.name} Package Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Service Fee & Taxes</span>
                <span>${serviceFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-100">
                <span>Total Due</span>
                <span className="text-[#1dbf73]">${total}</span>
              </div>
            </div>

            {/* Place Order CTA */}
            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3 bg-[#1dbf73] hover:bg-[#19a463] text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Lock size={16} />
              {isSubmitting ? 'Securing Transaction...' : `Confirm & Pay $${total}`}
            </button>

            <p className="text-center text-[11px] text-gray-400 mt-3 flex items-center justify-center gap-1">
              <Lock size={11} /> 256-bit encrypted simulated transaction
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
