import { Skeleton } from './Skeleton';
export function AnalyticsSkeleton() { return <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4"><Skeleton width="w-40" height="h-5" />{[1,2,3,4,5].map(item => <Skeleton key={item} width="w-full" height="h-3" />)}</div>; }
