'use client';

import { useOrientationStudents, useExpulsionRecords } from '@/app/hooks/use-student-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Clock, LogOut, ChevronRight, User as UserIcon, Calendar, Search, Loader2, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function Part10Dashboard() {
    const { data: orientationStudents = [], isLoading: loadingStudents } = useOrientationStudents();
    const { data: expulsionRecords = [], isLoading: loadingExpulsions } = useExpulsionRecords();

    const expulsionCount = expulsionRecords.length;

    return (
        <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-gray-500 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Dashboard'a Dön
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Part 10: Oryantasyon ve İhraç Kaydı</h1>
                    <p className="text-gray-500">Yeni öğrenci süreçleri ve disiplin kayıtları yönetimi</p>
                </div>
                <div className="flex space-x-3">
                    <Link href="/dashboard/part10/admin/expulsions">
                        <Button variant="outline" className="shadow-sm">
                            <LogOut className="h-4 w-4 mr-2 text-red-500" />
                            İhraç Kayıtları ({loadingExpulsions ? '...' : expulsionCount})
                        </Button>
                    </Link>
                    <Link href="/dashboard/part10/admin/add-student">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-md text-white">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Yeni Öğrenci Ekle
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg md:col-span-1 bg-white transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Hızlı Özet</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                            <div className="flex items-center">
                                <Clock className="h-5 w-5 text-indigo-600 mr-3" />
                                <span className="text-sm font-medium text-gray-700">Oryantasyondakiler</span>
                            </div>
                            <Badge variant="secondary" className="bg-indigo-200 text-indigo-700 border-0">
                                {loadingStudents ? <Loader2 className="h-3 w-3 animate-spin" /> : orientationStudents.length}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                            <div className="flex items-center">
                                <LogOut className="h-5 w-5 text-red-600 mr-3" />
                                <span className="text-sm font-medium text-gray-700">Toplam İhraç</span>
                            </div>
                            <Badge variant="secondary" className="bg-red-200 text-red-700 border-0">
                                {loadingExpulsions ? <Loader2 className="h-3 w-3 animate-spin" /> : expulsionCount}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg md:col-span-1 bg-white transition-all duration-300 hover:shadow-xl">
                    <CardHeader>
                        <CardTitle className="text-lg">Oryantasyon Nedir?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Yeni eklenen öğrenciler 3 haftalık bir deneme sürecine girer. Bu süreçte haftalık notlar alınır ve sonunda devam veya ihraç kararı verilir.
                        </p>
                        <div className="mt-4 flex items-center text-indigo-600 text-sm font-medium bg-indigo-50 p-2 rounded-lg inline-flex">
                            <Info className="h-4 w-4 mr-2" />
                            <span>3 Hafta Oryantasyon Süreci</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg md:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-600 text-white transition-all duration-300 hover:shadow-xl group">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center">
                            <Search className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                            Kayıtları Ara
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm opacity-90 mb-4">
                            Geçmişteki tüm ihraç kayıtlarını "İhraç Kayıtları" bölümünden detaylıca inceleyebilirsiniz.
                        </p>
                        <Link href="/dashboard/part10/admin/expulsions">
                            <Button variant="secondary" className="w-full bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm">
                                Kayıtlara Git
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>

            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Oryantasyon Sürecindeki Öğrenciler</CardTitle>
                        <CardDescription>3 haftalık süreci devam eden aday öğrenciler</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingStudents ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            <p className="text-sm text-gray-400">Veriler yükleniyor...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead>Rehber</TableHead>
                                    <TableHead>Başlangıç Tarihi</TableHead>
                                    <TableHead>Haftalık Notlar</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {orientationStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500 italic">
                                            Şu an oryantasyon sürecinde öğrenci bulunmuyor.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    orientationStudents.map((student: any) => (
                                        <TableRow key={student.id} className="border-gray-50 hover:bg-gray-50/50 transition-colors group">
                                            <TableCell>
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                        {student.firstName?.[0] || student.username[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-800">
                                                            {student.firstName} {student.lastName}
                                                        </div>
                                                        <div className="text-xs text-gray-400">@{student.username}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {student.tutor ? (
                                                    <div className="flex items-center">
                                                        <UserIcon className="h-3 w-3 mr-1 text-gray-400" />
                                                        {student.tutor.firstName} {student.tutor.lastName}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300 italic">Atanmamış</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                                    {new Date(student.createdAt).toLocaleDateString('tr-TR')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex space-x-1">
                                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${student.orientationProcess?.week1Notes ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                        H1
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${student.orientationProcess?.week2Notes ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                        H2
                                                    </Badge>
                                                    <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${student.orientationProcess?.week3Notes ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                                                        H3
                                                    </Badge>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/dashboard/part10/admin/orientation/${student.id}`}>
                                                    <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg">
                                                        Süreci Yönet
                                                        <ChevronRight className="ml-1 h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <div className="text-center mt-12 text-xs text-gray-400">
                © {new Date().getFullYear()} Bilgeverse. Tüm hakları saklıdır.
            </div>
        </div>
    );
}

function Info(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
