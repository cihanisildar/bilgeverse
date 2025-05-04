import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, BarChart2, Users, Award } from "lucide-react";

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Header Skeleton */}
        <div className="mb-4 sm:mb-6">
          <Skeleton className="h-6 sm:h-8 w-36 sm:w-48 mb-1.5 sm:mb-2" />
          <Skeleton className="h-3.5 sm:h-4 w-72 sm:w-96" />
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Students Count */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Öğrenci Sayınız</p>
                  <Skeleton className="h-6 sm:h-8 w-14 sm:w-16 mt-1" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Users className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Rank */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Ortalama Sıralama</p>
                  <Skeleton className="h-6 sm:h-8 w-14 sm:w-16 mt-1" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <BarChart2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Points */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Ortalama Puan</p>
                  <Skeleton className="h-6 sm:h-8 w-14 sm:w-16 mt-1" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Award className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Rank */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-500">En İyi Sıralama</p>
                  <Skeleton className="h-6 sm:h-8 w-14 sm:w-16 mt-1" />
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table Skeleton */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-medium flex items-center gap-1.5 sm:gap-2">
              <Trophy className="h-4 sm:h-5 w-4 sm:w-5 text-indigo-500" />
              Öğrenci Sıralaması
            </CardTitle>
            <Skeleton className="h-3.5 sm:h-4 w-48 sm:w-64" />
          </CardHeader>
          <CardContent>
            {/* Tab Buttons */}
            <div className="w-full sm:w-[300px] md:w-[400px] mb-4 sm:mb-6">
              <Skeleton className="h-9 sm:h-10 w-full rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12 sm:w-16">Sıra</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sm:w-24">Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <Skeleton className="h-3.5 sm:h-4 w-6 sm:w-8" />
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-full mr-2 sm:mr-3" />
                          <Skeleton className="h-3.5 sm:h-4 w-28 sm:w-32" />
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap text-right">
                        <Skeleton className="h-4 sm:h-5 w-14 sm:w-16 ml-auto rounded-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 