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
    <div className="border rounded-xl overflow-hidden shadow-lg w-full">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <SkeletonShimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
            <div className="space-y-2 flex-grow">
              <SkeletonShimmer className="h-4 sm:h-5 w-32 sm:w-40" />
              <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-32" />
            </div>
          </div>
          <SkeletonShimmer className="h-6 w-20 sm:w-24 rounded-full" />
        </div>
        <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-4 sm:h-5 w-28 sm:w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-4 sm:h-5 w-28 sm:w-32" />
          </div>
        </div>
        <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 sm:gap-3">
          <SkeletonShimmer className="h-8 sm:h-9 w-full sm:w-28 rounded-md" />
          <SkeletonShimmer className="h-8 sm:h-9 w-full sm:w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <div className="bg-gradient-to-r from-gray-200 to-gray-300 rounded-xl p-4 sm:p-6 shadow-lg w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-6">
        <div className="space-y-2 w-full sm:w-auto">
          <SkeletonShimmer className="h-6 sm:h-8 w-36 sm:w-48" />
          <SkeletonShimmer className="h-3 sm:h-4 w-48 sm:w-64" />
        </div>
        <SkeletonShimmer className="h-8 w-full sm:w-32 rounded-full" />
      </div>
    </div>
  );
}

export function SearchFilterSkeleton() {
  return (
    <div className="border rounded-xl shadow-lg p-4 sm:p-6 w-full">
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <SkeletonShimmer className="h-10 w-full rounded-md" />
        <SkeletonShimmer className="h-10 w-full sm:w-60 rounded-md" />
      </div>
    </div>
  );
}

export function UserCardSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <SkeletonShimmer className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
          <div className="space-y-1 min-w-0">
            <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-32" />
            <SkeletonShimmer className="h-2 sm:h-3 w-20 sm:w-24" />
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
        <SkeletonShimmer className="h-5 sm:h-6 w-16 sm:w-20 rounded-full" />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
        <SkeletonShimmer className="h-3 sm:h-4 w-32 sm:w-40" />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden lg:table-cell">
        <SkeletonShimmer className="h-5 sm:h-6 w-14 sm:w-16 rounded-full" />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden xl:table-cell">
        <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-end gap-1 sm:gap-2">
          <SkeletonShimmer className="h-7 sm:h-8 w-16 sm:w-20 rounded-md" />
          <SkeletonShimmer className="h-7 sm:h-8 w-16 sm:w-20 rounded-md" />
        </div>
      </td>
    </tr>
  );
}

export function LeaderboardEntrySkeleton() {
  return (
    <tr className="border-b border-gray-100">
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-1 sm:gap-2">
          <SkeletonShimmer className="h-5 sm:h-6 w-6 sm:w-8" />
          <SkeletonShimmer className="h-5 sm:h-6 w-5 sm:w-6" />
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <SkeletonShimmer className="h-8 w-8 sm:h-10 sm:w-10 rounded-full flex-shrink-0" />
          <div className="space-y-1">
            <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-32" />
            <SkeletonShimmer className="h-2 sm:h-3 w-20 sm:w-24" />
          </div>
        </div>
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
        <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-32" />
      </td>
      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
        <SkeletonShimmer className="h-5 sm:h-6 w-16 sm:w-20 rounded-full ml-auto" />
      </td>
    </tr>
  );
}

export function StoreItemCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg w-full">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="h-36 sm:h-48 bg-gray-100" />
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="space-y-2">
          <SkeletonShimmer className="h-5 sm:h-6 w-[70%] sm:w-3/4" />
          <SkeletonShimmer className="h-3 sm:h-4 w-[40%] sm:w-1/2" />
        </div>
        <div className="flex items-center justify-between gap-3">
          <SkeletonShimmer className="h-7 sm:h-8 w-20 sm:w-24 rounded-full" />
          <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-28" />
        </div>
      </div>
    </div>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg w-full">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonShimmer className="h-5 sm:h-6 w-36 sm:w-48" />
            <SkeletonShimmer className="h-3 sm:h-4 w-24 sm:w-32" />
          </div>
          <SkeletonShimmer className="h-5 sm:h-6 w-20 sm:w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-4 sm:h-5 w-24 sm:w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-4 sm:h-5 w-24 sm:w-32" />
          </div>
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-4 sm:h-5 w-24 sm:w-32" />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <SkeletonShimmer className="h-8 sm:h-9 w-full sm:w-28 rounded-md" />
          <SkeletonShimmer className="h-8 sm:h-9 w-full sm:w-28 rounded-md" />
        </div>
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="border rounded-xl overflow-hidden shadow-lg w-full">
      <div className="h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonShimmer className="h-3 sm:h-4 w-20 sm:w-24" />
            <SkeletonShimmer className="h-6 sm:h-8 w-12 sm:w-16" />
          </div>
          <SkeletonShimmer className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex-shrink-0" />
        </div>
      </div>
    </div>
  );
} 