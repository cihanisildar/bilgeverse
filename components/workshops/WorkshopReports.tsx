"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Badge } from "@/components/ui/badge";

interface ReportData {
    tutorStats: Array<{ tutorName: string; activityCount: number }>;
    workshopReports: Array<{
        id: string;
        name: string;
        activityCount: number;
        studentCount: number;
        attendanceRate: string | number;
    }>;
}

const COLORS = ['#f59e0b', '#fbbf24', '#d97706', '#b45309', '#92400e'];

export function WorkshopReports({ data }: { data: ReportData }) {
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Tutor Performance Chart */}
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle>Rehber Faaliyet Sayıları</CardTitle>
                        <CardDescription>Her rehberin oluşturduğu toplam faaliyet sayısı</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data.tutorStats}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="tutorName" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                    />
                                    <Bar dataKey="activityCount" radius={[4, 4, 0, 0]}>
                                        {data.tutorStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {data.workshopReports.slice(0, 4).map((w, i) => (
                        <Card key={w.id} className="border-0 shadow-md bg-white/80">
                            <CardHeader className="p-4">
                                <CardDescription className="text-xs uppercase font-bold text-amber-600">{w.name}</CardDescription>
                                <CardTitle className="text-2xl">{w.attendanceRate}%</CardTitle>
                                <p className="text-xs text-gray-500">Katılım Oranı</p>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Workshop Detail Table */}
            <Card className="border-0 shadow-xl overflow-hidden bg-white/90">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
                    <CardTitle>Atölye Raporları</CardTitle>
                    <CardDescription className="text-amber-50">Tüm atölyelerin genel performans metrikleri</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-amber-50">
                            <TableRow>
                                <TableHead className="font-bold">Atölye Adı</TableHead>
                                <TableHead className="font-bold">Öğrenci Sayısı</TableHead>
                                <TableHead className="font-bold">Faaliyet Sayısı</TableHead>
                                <TableHead className="font-bold text-right">Katılım Oranı</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.workshopReports.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell className="font-medium">{row.name}</TableCell>
                                    <TableCell>{row.studentCount}</TableCell>
                                    <TableCell>{row.activityCount}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant="outline" className="border-amber-200 text-amber-700">
                                            %{row.attendanceRate}
                                        </Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
