import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, BarChart2, Users, Award } from "lucide-react";

export function LeaderboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Stats Overview Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Students Count */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-indigo-500 to-blue-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Öğrenci Sayınız</p>
                  <Skeleton className="h-8 w-16 mt-1" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                  <Users className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Rank */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama Sıralama</p>
                  <Skeleton className="h-8 w-16 mt-1" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                  <BarChart2 className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Points */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Ortalama Puan</p>
                  <Skeleton className="h-8 w-16 mt-1" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                  <Award className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Best Rank */}
          <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200">
            <div className="h-1 bg-gradient-to-r from-yellow-400 to-amber-500"></div>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">En İyi Sıralama</p>
                  <Skeleton className="h-8 w-16 mt-1" />
                </div>
                <div className="w-12 h-12 flex items-center justify-center rounded-full bg-yellow-100 text-yellow-600">
                  <Trophy className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard Table Skeleton */}
        <Card className="border-0 shadow-lg rounded-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          <CardHeader>
            <CardTitle className="text-lg font-medium flex items-center gap-2">
              <Trophy className="h-5 w-5 text-indigo-500" />
              Öğrenci Sıralaması
            </CardTitle>
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent>
            {/* Tab Buttons */}
            <div className="w-full md:w-[400px] mb-6">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>

            {/* Table Skeleton */}
            <div className="rounded-md border overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Sıra</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Öğrenci</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Puan</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, index) => (
                    <tr key={index} className="border-b border-gray-100">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-8" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Skeleton className="h-8 w-8 rounded-full mr-3" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <Skeleton className="h-5 w-16 ml-auto rounded-full" />
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