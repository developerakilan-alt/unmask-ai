import type { HTMLAttributes } from 'react';

function shimmer(): string {
  return 'animate-pulse rounded-xl bg-white/[0.06]';
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
