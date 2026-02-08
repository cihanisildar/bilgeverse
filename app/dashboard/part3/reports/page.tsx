import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Calendar, BookOpen, AlertTriangle, PartyPopper, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function ReportsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard/part3">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Part 3'e Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-teal-600">
                            Raporlar
                        </span>
                    </h1>
                    <p className="text-gray-600">Öğretmen ve sınıf performans raporları</p>
                </div>

                {/* Report Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Weekly Participation Report */}
                    <Link href="/dashboard/part3/reports/weekly-participation" className="block">
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-blue-50 to-cyan-50">
                            <div className="h-2 bg-gradient-to-r from-blue-500 to-cyan-500"></div>
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                        <Calendar className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Haftalık Katılım</CardTitle>
                                        <CardDescription className="mt-1">
                                            Sınıf bazında haftalık yoklama istatistikleri
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-medium text-gray-600">
                                    Rapora Git
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Syllabus Tracking */}
                    <Link href="/dashboard/part3/reports/syllabus-tracking" className="block">
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-cyan-50 to-teal-50">
                            <div className="h-2 bg-gradient-to-r from-cyan-500 to-teal-500"></div>
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-cyan-100 text-cyan-600">
                                        <BookOpen className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Müfredat Takibi</CardTitle>
                                        <CardDescription className="mt-1">
                                            Öğretmen müfredatlarının tamamlanma durumu
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-medium text-gray-600">
                                    Rapora Git
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Attendance Alerts */}
                    <Link href="/dashboard/part3/reports/attendance-alerts" className="block">
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-orange-50 to-red-50">
                            <div className="h-2 bg-gradient-to-r from-orange-500 to-red-500"></div>
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-orange-100 text-orange-600">
                                        <AlertTriangle className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Devamsızlık Uyarıları</CardTitle>
                                        <CardDescription className="mt-1">
                                            Düşük katılımlı öğrenciler ve veli bildirimleri
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-medium text-gray-600">
                                    Rapora Git
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>

                    {/* Events Overview */}
                    <Link href="/dashboard/part3/reports/events-overview" className="block">
                        <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-gradient-to-br from-purple-50 to-pink-50">
                            <div className="h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
                            <CardHeader>
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 flex items-center justify-center rounded-full bg-purple-100 text-purple-600">
                                        <PartyPopper className="h-8 w-8" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">Etkinlik Özeti</CardTitle>
                                        <CardDescription className="mt-1">
                                            Sınıf etkinlikleri ve katılım istatistikleri
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center text-sm font-medium text-gray-600">
                                    Rapora Git
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                </div>
            </div>
        </div>
    );
}
