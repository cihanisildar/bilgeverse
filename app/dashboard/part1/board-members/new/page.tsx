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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
    userId: z.string().optional(),
    title: z.string().min(1, 'Ünvan gereklidir'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    password: z.string().optional(),
}).refine((data) => {
    if (data.userId) return true;
    return !!(data.firstName && data.lastName && data.username && data.email && data.password);
}, {
    message: "Ya mevcut bir kullanıcı seçilmeli ya da yeni kullanıcı bilgileri tam doldurulmalıdır",
    path: ["userId"]
});

type FormData = z.infer<typeof formSchema>;

export default function NewBoardMemberPage() {
    const router = useRouter();
    const { isAdmin } = useAuth();
    const createMember = useCreateBoardMember();
    const { data: users, isLoading: loadingUsers } = useAllUsers();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationType, setCreationType] = useState<'existing' | 'new'>('existing');

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
        setValue,
        clearErrors
    } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: '',
            title: ''
        }
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
            // Filter data based on creationType
            const submitData = creationType === 'existing'
                ? { userId: data.userId, title: data.title }
                : {
                    title: data.title,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    username: data.username,
                    email: data.email,
                    password: data.password
                };

            const result = await createMember.mutateAsync(submitData as any);
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
                    <p className="text-gray-600">Sistemdeki bir kullanıcıyı seçin veya yeni bir üye oluşturun</p>
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
                                <CardDescription className="mt-1">Üye tipini seçin ve bilgilerini doldurun</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <Tabs defaultValue="existing" onValueChange={(v) => {
                                setCreationType(v as 'existing' | 'new');
                                clearErrors();
                            }} className="w-full">
                                <TabsList className="grid w-full grid-cols-2 mb-6">
                                    <TabsTrigger value="existing">Sistemden Seç</TabsTrigger>
                                    <TabsTrigger value="new">Yeni Kayıt</TabsTrigger>
                                </TabsList>

                                <TabsContent value="existing" className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="userId" className="text-gray-700 font-medium">
                                            Kullanıcı <span className="text-red-500">*</span>
                                        </Label>
                                        <Controller
                                            name="userId"
                                            control={control}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500">
                                                        <SelectValue placeholder="Kullanıcı seçin..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {userOptions.map((option) => (
                                                            <SelectItem key={option.value} value={option.value}>
                                                                {option.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {errors.userId && (
                                            <p className="text-sm text-red-600">{errors.userId.message}</p>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="new" className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="firstName">Ad <span className="text-red-500">*</span></Label>
                                            <Input id="firstName" {...register('firstName')} placeholder="Ad" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="lastName">Soyad <span className="text-red-500">*</span></Label>
                                            <Input id="lastName" {...register('lastName')} placeholder="Soyad" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="username">Kullanıcı Adı <span className="text-red-500">*</span></Label>
                                        <Input id="username" {...register('username')} placeholder="kullanici.adi" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">E-posta <span className="text-red-500">*</span></Label>
                                        <Input id="email" type="email" {...register('email')} placeholder="ornek@email.com" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Şifre <span className="text-red-500">*</span></Label>
                                        <Input id="password" type="password" {...register('password')} placeholder="••••••••" />
                                    </div>
                                </TabsContent>
                            </Tabs>

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
