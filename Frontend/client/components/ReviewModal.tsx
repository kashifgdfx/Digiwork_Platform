'use client';
import { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { ReviewPayload } from '@/types';
import { useToast } from '@/context/ToastContext';

export function ReviewModal({
  orderId,
  onClose,
  onSubmit,
}: {
  orderId: string;
  onClose: () => void;
  onSubmit: (payload: ReviewPayload) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { error: toastError } = useToast();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rating || !comment.trim()) {
      toastError('Choose a star rating and share your experience.');
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ orderId, rating, comment: comment.trim() });
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (err) {
      toastError(err instanceof Error ? err.message : 'Unable to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Leave a review</h2>
            <p className="mt-1 text-sm text-gray-500">Your feedback helps the Fiverr community.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded p-1 text-gray-500 hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="py-12 text-center text-emerald-700">
            <CheckCircle2 className="mx-auto mb-3" size={42} />
            <p className="font-bold">Review submitted. Thank you!</p>
          </div>
        ) : (
          <>
            <div className="mt-6">
              <p className="mb-2 text-sm font-semibold text-gray-800">Overall experience</p>
              <StarRating rating={rating} interactive onChange={setRating} size="lg" showCount={false} />
            </div>

            <label className="mt-6 block text-sm font-semibold text-gray-800">
              Your review
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={2000}
                rows={5}
                className="mt-2 w-full rounded-xl border border-gray-300 p-3 text-sm font-normal outline-none focus:border-[#1dbf73] focus:ring-2 focus:ring-emerald-100"
                placeholder="What did you like about working with this seller?"
              />
            </label>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="rounded-xl bg-[#1dbf73] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {loading ? 'Submitting…' : 'Submit review'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
