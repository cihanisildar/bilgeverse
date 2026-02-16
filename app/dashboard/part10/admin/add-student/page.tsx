'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTutors, useCreateStudentManual } from '@/app/hooks/use-student-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, UserPlus, Info, Loader2, Sparkles, User as UserIcon, Lock, AtSign } from "lucide-react";
import Link from 'next/link';

export default function AddStudentPage() {
    const router = useRouter();
    const { data: tutors = [], isLoading: loadingTutors } = useTutors();
    const createStudentMutation = useCreateStudentManual();

    const [formData, setFormData] = useState({
        username: '',
        password: '',
        firstName: '',
        lastName: '',
        tutorId: '',
        firstImpressionNotes: ''
    });

    const isFormValid = formData.username && formData.password && formData.firstName && formData.lastName && formData.tutorId;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isFormValid) return;

        const result = await createStudentMutation.mutateAsync(formData);
        if (!result.error) {
            router.push('/dashboard/part10/admin');
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-8 bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/part10/admin">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm">
                            <ArrowLeft className="h-5 w-5 text-gray-500" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Yeni Öğrenci Ekle</h1>
                        <p className="text-gray-500">Sisteme manuel öğrenci kaydı ve oryantasyon başlatma</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card className="border-0 shadow-2xl rounded-[2rem] overflow-hidden bg-white/80 backdrop-blur-sm ring-1 ring-indigo-50">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <CardHeader className="pb-2 text-center pt-8">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 shadow-inner">
                                <Sparkles className="h-8 w-8" />
                            </div>
                            <CardTitle className="text-2xl font-black text-gray-800 tracking-tight">Öğrenci Profili</CardTitle>
                            <CardDescription>Oryantasyon sürecine dahil edilecek öğrenci bilgileri</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Adı</Label>
                                    <div className="relative group">
                                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder="Örn: Ahmet"
                                            className="pl-10 h-11 rounded-xl border-gray-100 bg-white/50 focus:bg-white transition-all"
                                            value={formData.firstName}
                                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Soyadı</Label>
                                    <Input
                                        placeholder="Örn: Yılmaz"
                                        className="h-11 rounded-xl border-gray-100 bg-white/50 focus:bg-white transition-all"
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Kullanıcı Adı</Label>
                                    <div className="relative group">
                                        <AtSign className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            placeholder="ahmet_yilmaz"
                                            className="pl-10 h-11 rounded-xl border-gray-100 bg-white/50 focus:bg-white transition-all"
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-bold text-gray-700 ml-1">Şifre</Label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                        <Input
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 h-11 rounded-xl border-gray-100 bg-white/50 focus:bg-white transition-all"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-700 ml-1">Rehber Seçimi</Label>
                                <Select
                                    value={formData.tutorId}
                                    onValueChange={(val) => setFormData({ ...formData, tutorId: val })}
                                    required
                                >
                                    <SelectTrigger className="h-11 rounded-xl border-gray-100 bg-white/50 focus:bg-white transition-all">
                                        <SelectValue placeholder={loadingTutors ? "Rehberler yükleniyor..." : "Bir rehber seçin"} />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-indigo-50 shadow-xl">
                                        {tutors.map((tutor: any) => (
                                            <SelectItem key={tutor.id} value={tutor.id} className="rounded-lg">
                                                {tutor.firstName} {tutor.lastName} (@{tutor.username})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-bold text-gray-700 ml-1">İlk İzlenim Notları (Oryantasyon Başlangıcı)</Label>
                                <Textarea
                                    placeholder="Öğrenci hakkındaki ilk görüşlerinizi ve varsa özel durumları belirtin..."
                                    className="min-h-[120px] rounded-2xl border-gray-100 bg-white/50 focus:bg-white transition-all"
                                    value={formData.firstImpressionNotes}
                                    onChange={(e) => setFormData({ ...formData, firstImpressionNotes: e.target.value })}
                                />
                            </div>

                            <div className="p-4 bg-indigo-50 rounded-2xl flex gap-3 border border-indigo-100 shadow-inner">
                                <Info className="h-5 w-5 text-indigo-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                                    Bu işlem sonucunda öğrenci <strong>Oryantasyon</strong> statüsünde oluşturulacak ve 3 haftalık süreci otomatik olarak başlayacaktır.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter className="pb-8 pt-4 flex flex-col space-y-4">
                            <Button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl text-white font-bold text-lg shadow-lg shadow-indigo-100 transition-all hover:-translate-y-0.5"
                                disabled={!isFormValid || createStudentMutation.isPending}
                            >
                                {createStudentMutation.isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Öğrenci Kaydediliyor...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="h-5 w-5 mr-2" />
                                        Kaydı Tamamla ve Başlat
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center text-gray-400">
                                Kayıt başarılı olduktan sonra otomatik olarak listeye yönlendirileceksiniz.
                            </p>
                        </CardFooter>
                    </Card>
                </form>
            </div>
        </div>
    );
}
