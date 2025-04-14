import { cn } from "@/lib/utils";

interface SkeletonShimmerProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function SkeletonShimmer({ className, ...props }: SkeletonShimmerProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}

export function RequestCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SkeletonShimmer className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <SkeletonShimmer className="h-5 w-40" />
              <SkeletonShimmer className="h-4 w-32" />
            </div>
          </div>
          <SkeletonShimmer className="h-6 w-24 rounded-full" />
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-5 w-32" />
          </div>
        </div>
        <div className="mt-6 flex gap-3">
          <SkeletonShimmer className="h-9 w-28 rounded-md" />
          <SkeletonShimmer className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-6 shadow-lg">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div className="space-y-2">
          <SkeletonShimmer className="h-8 w-48" />
          <SkeletonShimmer className="h-4 w-64" />
        </div>
        <SkeletonShimmer className="h-8 w-32 rounded-full" />
      </div>
    </div>
  );
}

export function SearchFilterSkeleton() {
  return (
    <div className="border rounded-xl shadow-lg p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <SkeletonShimmer className="h-10 flex-1 rounded-md" />
        <SkeletonShimmer className="h-10 w-60 rounded-md" />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-6 py-4">
        <div className="flex items-center">
          <SkeletonShimmer className="h-10 w-10 rounded-full" />
          <div className="ml-4 space-y-1">
            <SkeletonShimmer className="h-4 w-32" />
            <SkeletonShimmer className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <SkeletonShimmer className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <SkeletonShimmer className="h-4 w-40" />
      </td>
      <td className="px-6 py-4">
        <SkeletonShimmer className="h-6 w-16 rounded-full" />
      </td>
      <td className="px-6 py-4">
        <SkeletonShimmer className="h-4 w-24" />
      </td>
      <td className="px-6 py-4 text-right">
        <div className="flex justify-end gap-2">
          <SkeletonShimmer className="h-8 w-20 rounded-md" />
          <SkeletonShimmer className="h-8 w-20 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function LeaderboardEntrySkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <SkeletonShimmer className="h-6 w-8" />
          <SkeletonShimmer className="h-6 w-6" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center">
          <SkeletonShimmer className="h-10 w-10 rounded-full mr-3" />
          <div className="space-y-1">
            <SkeletonShimmer className="h-4 w-32" />
            <SkeletonShimmer className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <SkeletonShimmer className="h-4 w-32" />
      </td>
      <td className="px-6 py-4 text-right">
        <SkeletonShimmer className="h-6 w-20 rounded-full ml-auto" />
      </td>
    </tr>
  );
}

export function StoreItemCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="h-48 bg-gray-100" />
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <SkeletonShimmer className="h-6 w-3/4" />
          <SkeletonShimmer className="h-4 w-1/2" />
        </div>
        <div className="flex items-center justify-between">
          <SkeletonShimmer className="h-8 w-24 rounded-full" />
          <SkeletonShimmer className="h-4 w-28" />
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonShimmer className="h-6 w-48" />
            <SkeletonShimmer className="h-4 w-32" />
          </div>
          <SkeletonShimmer className="h-6 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-5 w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-5 w-32" />
          </div>
        </div>
        <div className="flex gap-3">
          <SkeletonShimmer className="h-9 w-28 rounded-md" />
          <SkeletonShimmer className="h-9 w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonShimmer className="h-4 w-24" />
            <SkeletonShimmer className="h-8 w-16" />
          </div>
          <SkeletonShimmer className="h-12 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
} 