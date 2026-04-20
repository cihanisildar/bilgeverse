import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Skeleton */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-2xl bg-amber-100/50" />
              <Skeleton className="h-12 w-64 rounded-2xl" />
            </div>
            <Skeleton className="h-6 w-96 rounded-xl" />
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
          <div className="flex justify-between items-center border-b border-gray-50 pb-6">
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32 rounded-xl" />
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
            <Skeleton className="h-10 w-48 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="rounded-3xl border-gray-100 shadow-sm overflow-hidden flex flex-col h-[400px]">
                <Skeleton className="h-48 w-full" />
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                    <Skeleton className="h-7 w-3/4 rounded-lg" />
                    <Skeleton className="h-4 w-full rounded-md" />
                    <Skeleton className="h-4 w-5/6 rounded-md" />
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Skeleton className="h-4 w-20 rounded-md" />
                      <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                    <Skeleton className="h-12 w-full rounded-2xl" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
