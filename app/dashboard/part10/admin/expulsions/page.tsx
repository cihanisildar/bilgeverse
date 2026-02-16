'use client';

import { useExpulsionRecords } from '@/app/hooks/use-student-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, User, Calendar, FileText, Search, Loader2, Info, Mail, Phone, ShieldCheck } from "lucide-react";
import Link from 'next/link';
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

export default function ExpulsionsPage() {
    const { data: expulsionRecords = [], isLoading } = useExpulsionRecords();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<any>(null);

    const filteredRecords = expulsionRecords.filter((record: any) =>
        `${record.studentName} ${record.studentSurname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.username && record.username.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-red-50 via-white to-orange-50 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <Link href="/dashboard/part10/admin">
                        <Button variant="ghost" size="sm" className="mb-2 -ml-2 text-gray-500 hover:text-gray-800">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Geri Dön
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">İhraç Kayıtları (İhraç Kaydı)</h1>
                    <p className="text-gray-500">Sistemden ayrılan öğrencilerin kalıcı disiplin ve ayrılış kayıtları</p>
                </div>
            </div>

            <Card className="border-0 shadow-xl rounded-2xl overflow-hidden bg-white">
                <div className="h-1 bg-gradient-to-r from-red-500 to-orange-500"></div>
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle>Tüm Kayıtlar</CardTitle>
                            <CardDescription>Resmi ihraç ve ayrılış belgeleri arşivi</CardDescription>
                        </div>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Öğrenci adı veya kullanıcı adı..."
                                className="pl-10 h-10 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-red-600" />
                            <p className="text-sm text-gray-400">Kayıtlar yükleniyor...</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-gray-100">
                                    <TableHead>Öğrenci</TableHead>
                                    <TableHead>İhraç Tarihi</TableHead>
                                    <TableHead>Sorumlu Yönetici</TableHead>
                                    <TableHead>Gerekçe</TableHead>
                                    <TableHead>Notlar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredRecords.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-gray-500 italic">
                                            {searchTerm ? 'Arama kriterlerine uygun kayıt bulunamadı.' : 'Henüz bir ihraç kaydı bulunmuyor.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredRecords.map((record: any) => (
                                        <TableRow
                                            key={record.id}
                                            className="border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer"
                                            onClick={() => setSelectedRecord(record)}
                                        >
                                            <TableCell>
                                                <div>
                                                    <div className="font-bold text-gray-800">
                                                        {record.studentName} {record.studentSurname}
                                                    </div>
                                                    {record.username && (
                                                        <div className="text-xs text-gray-400 italic">@{record.username}</div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center text-gray-600">
                                                    <Calendar className="h-3 w-3 mr-1 text-red-400" />
                                                    {new Date(record.expulsionDate).toLocaleDateString('tr-TR')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                <div className="flex items-center text-indigo-600 font-medium">
                                                    <User className="h-3 w-3 mr-1 text-indigo-400" />
                                                    {record.responsible ? `${record.responsible.firstName} ${record.responsible.lastName}` : 'Sistem'}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[200px] truncate text-sm font-medium text-red-700 bg-red-50 px-2 py-1 rounded border border-red-100 inline-block">
                                                    {record.reason}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-[250px] text-xs text-gray-500 leading-relaxed italic line-clamp-1">
                                                    <FileText className="h-3 w-3 inline mr-1 opacity-50" />
                                                    {record.notes || '-'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!selectedRecord} onOpenChange={() => setSelectedRecord(null)}>
                <DialogContent className="sm:max-w-[500px] rounded-3xl border-0 shadow-2xl p-0 overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500"></div>
                    <DialogHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-100 px-3 py-1">
                                İhraç Kaydı Detayı
                            </Badge>
                            <span className="text-xs text-gray-400 font-medium flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {selectedRecord && new Date(selectedRecord.expulsionDate).toLocaleDateString('tr-TR')}
                            </span>
                        </div>
                        <DialogTitle className="text-2xl font-black text-gray-800 tracking-tight">
                            {selectedRecord?.studentName} {selectedRecord?.studentSurname}
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 font-medium">
                            @{selectedRecord?.username || 'kullanici_adi'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                                <Mail className="h-5 w-5 text-gray-400 mb-2" />
                                <Label className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">E-Posta</Label>
                                <span className="text-xs font-bold text-gray-700 break-all">{selectedRecord?.email || '-'}</span>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                                <Phone className="h-5 w-5 text-gray-400 mb-2" />
                                <Label className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">Telefon</Label>
                                <span className="text-xs font-bold text-gray-700 break-all">{selectedRecord?.phone || '-'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-red-600 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="h-3 w-3" /> İhraç Gerekçesi
                                </Label>
                                <div className="p-4 bg-red-50/50 rounded-2xl border border-red-100/50 text-sm text-red-800 font-medium leading-relaxed break-words">
                                    {selectedRecord?.reason}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <FileText className="h-3 w-3" /> Ek Notlar
                                </Label>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 italic leading-relaxed break-words">
                                    {selectedRecord?.notes || 'Ek not bulunmuyor.'}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex items-center justify-between sticky bottom-0 bg-white">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                        <ShieldCheck className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Sorumlu Yönetici</div>
                                        <div className="text-xs font-bold text-gray-700">
                                            {selectedRecord?.responsible ? `${selectedRecord.responsible.firstName} ${selectedRecord.responsible.lastName}` : 'Sistem'}
                                        </div>
                                    </div>
                                </div>
                                <Button variant="outline" className="rounded-xl px-6 h-9 text-xs font-bold" onClick={() => setSelectedRecord(null)}>
                                    Kapat
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <div className="text-center mt-12 text-xs text-gray-400">
                © {new Date().getFullYear()} Bilgeverse. Arşiv Sistemi.
            </div>
        </div>
    );
}
