import type { HTMLAttributes } from 'react';

function shimmer(): string {
  return 'skeleton-shimmer rounded-xl';
}

export function Skeleton({ className = '', ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`${shimmer()} ${className}`} {...rest} />;
}

export function ResultSkeleton() {
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-col items-center">
        <Skeleton className="h-48 w-48" />
        <Skeleton className="mt-5 h-8 w-40" />
        <Skeleton className="mt-3 h-3 w-64" />
      </div>
      <div className="mt-6 space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
    </div>
  );
}

/** Full-page placeholder shown while a lazy-loaded route mounts. */
export function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16">
      <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-4 h-10 w-64 max-w-full" />
        <Skeleton className="mt-4 h-4 w-full max-w-md" />
      </div>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
