import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { GraduationCap, Trophy, CheckCircle } from "lucide-react"

export function StudentListSkeleton() {
  return (
    <div className="space-y-8">
      {/* Stats cards skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Toplam Öğrenci</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <GraduationCap className="h-8 w-8 text-gray-300 mr-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-green-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">Ortalama Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Trophy className="h-8 w-8 text-gray-300 mr-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border border-purple-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl text-gray-700">En Yüksek Puan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-gray-300 mr-3" />
              <Skeleton className="h-8 w-16" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Students list skeleton */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Avatar className="h-12 w-12 mr-4 border border-gray-200">
                    <Skeleton className="h-12 w-12 rounded-full" />
                  </Avatar>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <Skeleton className="h-3 w-8 mb-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 