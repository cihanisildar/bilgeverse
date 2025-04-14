import { Avatar } from "@/components/ui/avatar"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Calendar, Clock, Tag, Users } from "lucide-react"

export function EventListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Grid view skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={`grid-skeleton-${i}`} className="border border-gray-200">
            <CardHeader className="relative pb-3">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-24" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
              <Skeleton className="h-6 w-3/4 mt-3" />
              <div className="flex gap-1 mt-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6 mb-3" />
              <div className="space-y-2">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-300 mr-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 text-gray-300 mr-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-300 mr-2" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <div className="flex items-center">
                  <Tag className="h-4 w-4 text-gray-300 mr-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3 flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-7 w-7 mr-2">
                  <Skeleton className="h-full w-full rounded-full" />
                </Avatar>
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-20" />
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* List view skeleton */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="grid grid-cols-12 px-6 py-3 bg-gray-50 border-b border-gray-200 rounded-t-lg">
          <div className="col-span-4">
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-12" />
          </div>
          <div className="col-span-1">
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="col-span-2">
            <Skeleton className="h-4 w-20 ml-auto" />
          </div>
        </div>

        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`list-skeleton-${i}`} className="grid grid-cols-12 px-6 py-4 items-center border-b border-gray-100">
            <div className="col-span-4">
              <div className="flex items-start">
                <div className="p-2 rounded bg-gray-50 mr-3">
                  <Calendar className="h-5 w-5 text-gray-300" />
                </div>
                <div>
                  <Skeleton className="h-5 w-48 mb-1" />
                  <Skeleton className="h-4 w-64" />
                  <div className="flex gap-1 mt-1">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            </div>
            <div className="col-span-2">
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="col-span-1">
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="col-span-1">
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="col-span-1">
              <Skeleton className="h-4 w-12" />
            </div>
            <div className="col-span-1">
              <Skeleton className="h-6 w-20" />
            </div>
            <div className="col-span-2 flex justify-end gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
} 