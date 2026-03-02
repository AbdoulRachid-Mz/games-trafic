import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cover skeleton */}
      <Skeleton className="h-[300px] w-full rounded-xl" />

      {/* Avatar and actions */}
      <div className="relative px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <Skeleton className="w-32 h-32 rounded-full -mt-16 sm:-mt-20 border-4 border-background" />
          <div className="flex-1 flex justify-end gap-2 pb-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>

        {/* Info skeleton */}
        <div className="mt-4 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}