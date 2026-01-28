import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-parchment-400/50",
        className
      )}
      {...props}
    />
  );
}

export function NewsCardSkeleton() {
  return (
    <div className="rounded-lg border border-parchment-400 bg-white shadow-card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-7 w-full mb-2" />
      <Skeleton className="h-7 w-3/4 mb-4" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}

export function DetailPanelSkeleton() {
  return (
    <div className="rounded-lg border border-parchment-400 bg-white shadow-card p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-8 w-full mb-2" />
      <Skeleton className="h-8 w-4/5 mb-6" />

      <div className="border-t border-dashed border-gray-300 pt-6 mb-6">
        <Skeleton className="h-5 w-20 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="border-t border-dashed border-gray-300 pt-6">
        <Skeleton className="h-5 w-32 mb-3" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-4 w-full mb-3" />
        <Skeleton className="h-4 w-5/6" />
      </div>
    </div>
  );
}
