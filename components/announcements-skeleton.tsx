import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function AnnouncementsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="p-6 border-0 shadow-lg rounded-3xl bg-white space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-7 w-3/4 rounded-lg" />
              <Skeleton className="h-4 w-1/2 rounded-md" />
            </div>
            <Skeleton className="h-12 w-12 rounded-2xl bg-teal-50" />
          </div>
          <div className="space-y-2 pt-2">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-4 w-5/6 rounded-md" />
            <Skeleton className="h-4 w-4/6 rounded-md" />
          </div>
          <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-md" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </Card>
      ))}
    </div>
  );
} 