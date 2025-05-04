import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Award } from "lucide-react"

export function PointsPageSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* Left Column - Student List */}
      <div className="lg:col-span-1 space-y-3 sm:space-y-4">
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center text-blue-700 text-base sm:text-lg">
              <Search className="mr-1.5 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              Öğrenci Ara
            </CardTitle>
            <Skeleton className="h-3.5 sm:h-4 w-36 sm:w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div className="relative">
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              
              <div className="space-y-1.5 sm:space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-2.5 sm:p-3 rounded-md border border-gray-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1" />
                        <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24" />
                      </div>
                      <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Award Points Form and History */}
      <div className="lg:col-span-2 space-y-4 sm:space-y-6">
        {/* Award Points Form */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center text-blue-700 text-base sm:text-lg">
              <Award className="mr-1.5 sm:mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              Puan Ver
            </CardTitle>
            <Skeleton className="h-3.5 sm:h-4 w-48 sm:w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-1.5 sm:mb-2" />
                <Skeleton className="h-9 sm:h-10 w-full" />
              </div>
              <div>
                <Skeleton className="h-4 sm:h-5 w-20 sm:w-24 mb-1.5 sm:mb-2" />
                <Skeleton className="h-28 sm:h-32 w-full" />
              </div>
              <Skeleton className="h-9 sm:h-10 w-full" />
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="flex items-center text-blue-700 text-base sm:text-lg">
              Son İşlemler
            </CardTitle>
            <Skeleton className="h-3.5 sm:h-4 w-36 sm:w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <Skeleton className="h-4 sm:h-5 w-28 sm:w-32 mb-1" />
                      <Skeleton className="h-3.5 sm:h-4 w-20 sm:w-24" />
                    </div>
                    <Skeleton className="h-5 sm:h-6 w-16 sm:w-20" />
                  </div>
                  <Skeleton className="h-3.5 sm:h-4 w-full mt-1.5 sm:mt-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 