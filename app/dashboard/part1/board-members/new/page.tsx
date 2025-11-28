'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { useCreateBoardMember, useAllUsers } from '@/app/hooks/use-board-members';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Loading from '@/app/components/Loading';
import { Combobox } from '@/components/ui/combobox';

const formSchema = z.object({
    userId: z.string().min(1, 'Kullanıcı seçilmelidir'),
    title: z.string().min(1, 'Ünvan gereklidir'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewBoardMemberPage() {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const createMember = useCreateBoardMember();
    const { data: users, isLoading: loadingUsers } = useAllUsers();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
    });

    const userOptions = useMemo(() => {
        if (!users) return [];
        return users.map((user) => ({
            value: user.id,
            label: `${user.displayName} (${user.username})`,
        }));
    }, [users]);

    const onSubmit = async (data: FormData) => {
        setIsSubmitting(true);
        try {
            const result = await createMember.mutateAsync(data);
            if (result && !result.error) {
                router.push('/dashboard/part1/board-members');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
                <div className="max-w-2xl mx-auto">
                    <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                        <CardContent className="text-center py-12">
                            <p className="text-red-600">Yetkisiz erişim</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (loadingUsers) {
        return <Loading fullScreen />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6 lg:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => router.push('/dashboard/part1/board-members')}
                        className="mb-4 text-gray-600 hover:text-gray-800"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön
                    </Button>
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                            Yeni Yönetim Kurulu Üyesi
                        </span>
                    </h1>
                    <p className="text-gray-600">Sistemdeki bir kullanıcıyı yönetim kurulu üyesi olarak ekleyin</p>
                </div>

                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                    <CardHeader>
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                <Users className="h-8 w-8" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Üye Bilgileri</CardTitle>
                                <CardDescription className="mt-1">Kullanıcı seçin ve ünvanını belirleyin</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="userId" className="text-gray-700 font-medium">
                                    Kullanıcı <span className="text-red-500">*</span>
                                </Label>
                                <Controller
                                    name="userId"
                                    control={control}
                                    render={({ field }) => (
                                        <Combobox
                                            options={userOptions}
                                            value={field.value}
                                            onValueChange={field.onChange}
                                            placeholder="Kullanıcı seçin..."
                                            searchPlaceholder="Kullanıcı ara..."
                                            emptyText="Kullanıcı bulunamadı"
                                            className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                        />
                                    )}
                                />
                                {errors.userId && (
                                    <p className="text-sm text-red-600">{errors.userId.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title" className="text-gray-700 font-medium">
                                    Ünvan <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="title"
                                    {...register('title')}
                                    placeholder="Örn: Başkan, Üye, Sekreter"
                                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-600">{errors.title.message}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3 pt-4">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-500/60"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    {isSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/part1/board-members')}
                                    disabled={isSubmitting}
                                    className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                                >
                                    İptal
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
