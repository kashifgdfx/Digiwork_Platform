'use client';
import { useEffect, useState } from 'react';
import { Globe, UserCheck } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { Review } from '@/types';
import { StarRating } from './StarRating';
import { ReviewsSkeleton } from './skeletons/ReviewsSkeleton';
import { useToast } from '@/context/ToastContext';

export function ReviewList({ gigId, rating, reviewCount }: { gigId: string; rating: number; reviewCount: number }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const { error: toastError } = useToast();

  useEffect(() => {
    let live = true;

    const load = async () => {
      try {
        const response = await apiFetch(`/api/reviews/gig/${gigId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load reviews');
        if (live) setReviews(data.reviews || []);
      } catch (err) {
        if (live) toastError(err instanceof Error ? err.message : 'Unable to load reviews');
      } finally {
        if (live) setLoading(false);
      }
    };

    load();

    const socket = socketService.getSocket();
    const refresh = (payload: { gigId: string }) => { if (payload.gigId === gigId) load(); };
    socket?.on('reviewCreated', refresh);
    socket?.on('reviewUpdated', refresh);
    socket?.on('reviewDeleted', refresh);

    return () => {
      live = false;
      socket?.off('reviewCreated', refresh);
      socket?.off('reviewUpdated', refresh);
      socket?.off('reviewDeleted', refresh);
    };
  }, [gigId]);

  if (loading) return <ReviewsSkeleton />;

  return (
    <section className="pt-6 border-t border-gray-100">
      <h2 className="text-xl font-bold text-gray-900">Reviews &amp; Ratings</h2>
      <div className="mt-2">
        <StarRating rating={rating} reviewCount={reviewCount} size="md" />
      </div>

      {reviews.length === 0 ? (
        <p className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
          No reviews yet. Completed buyers can be the first to leave feedback.
        </p>
      ) : (
        <div className="mt-5 space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-gray-100 bg-gray-50/70 p-5"
            >
              <div className="flex justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={review.buyerAvatar || '/images/default-avatar.png'}
                    alt={review.buyerName}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="text-sm font-bold text-gray-900">{review.buyerName}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-400">
                      <Globe size={11} /> Verified buyer
                    </p>
                  </div>
                </div>
                <time className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <StarRating rating={review.rating} size="sm" showCount={false} />
                <span className="flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <UserCheck size={11} /> Verified Buyer
                </span>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-gray-700">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
