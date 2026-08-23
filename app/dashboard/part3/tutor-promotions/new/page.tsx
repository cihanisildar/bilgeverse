'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEligibleUsers, useCreatePromotion } from '@/app/hooks/use-tutor-promotions';
import Loading from '@/app/components/Loading';
import { PROMOTION_TARGETS, rolesLabel } from '@/app/lib/promotion-roles';
import { useMemo } from 'react';

export default function NewPromotionPage() {
    const router = useRouter();
    const { data: users, isLoading, error } = useEligibleUsers();
    const createPromotion = useCreatePromotion();

    const [formData, setFormData] = useState({
        userId: '',
        requestedRole: 'TUTOR',
        notes: '',
    });

    // Hedef role göre süzme: kişi zaten o role sahipse listede çıkmasın.
    // (Sunucu tarafı da aynı kuralı uyguluyor.)
    const selectableUsers = useMemo(
        () =>
            (users ?? []).filter((u) => {
                const roles = u.roles?.length ? u.roles : [u.role].filter(Boolean);
                return !roles.includes(formData.requestedRole as typeof u.role);
            }),
        [users, formData.requestedRole]
    );

    const selectedTarget = PROMOTION_TARGETS.find((t) => t.value === formData.requestedRole);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        createPromotion.mutate(formData, {
            onSuccess: (result) => {
                if (!result.error) {
                    router.push('/dashboard/part3/tutor-promotions');
                    router.refresh();
                }
            },
        });
    };

    if (isLoading) {
        return <Loading fullScreen />;
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
                <div className="max-w-4xl mx-auto">
                    <p className="text-center text-red-600">Hata: {error.message}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-6 lg:p-8">
            <div className="max-w-4xl mx-auto">
                <Link href="/dashboard/part3/tutor-promotions">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100 transition-all duration-200">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Geri Dön
                    </Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
                            Yeni Terfi Talebi
                        </span>
                    </h1>
                    <p className="text-gray-600">Bir kişiyi Rehber, Lider veya Yönetim Kurulu Üyesi olarak değerlendirin</p>
                </div>

                <Card className="border-0 shadow-lg rounded-2xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                    <CardHeader>
                        <CardTitle>Terfi Formu</CardTitle>
                        <CardDescription>
                            Terfi ettirmek istediğiniz kişiyi seçin ve notlarınızı ekleyin
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="requestedRole">Hedef Rol *</Label>
                                <Select
                                    value={formData.requestedRole}
                                    onValueChange={(value) =>
                                        // Hedef rol değişince seçili kişi listeden düşmüş olabilir; seçim sıfırlanır.
                                        setFormData({ ...formData, requestedRole: value, userId: '' })
                                    }
                                    required
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {PROMOTION_TARGETS.map((target) => (
                                            <SelectItem key={target.value} value={target.value}>
                                                {target.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {selectedTarget && (
                                    <p className="text-sm text-gray-500 mt-2">{selectedTarget.description}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="userId">Kullanıcı *</Label>
                                <Select
                                    value={formData.userId}
                                    onValueChange={(value) => setFormData({ ...formData, userId: value })}
                                    required
                                >
                                    <SelectTrigger className="mt-2">
                                        <SelectValue placeholder="Bir kullanıcı seçin" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {selectableUsers.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                Uygun kullanıcı bulunamadı
                                            </SelectItem>
                                        ) : (
                                            selectableUsers.map((user) => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.firstName} {user.lastName} (@{user.username}) — {rolesLabel(user.roles, user.role)}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label htmlFor="notes">Notlar</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Görüşme notları, gözlemler ve değerlendirmeler..."
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={6}
                                    className="mt-2"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Bu notlar terfi sürecinde referans olarak kullanılacaktır
                                </p>
                            </div>

                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={createPromotion.isPending || !formData.userId}
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                                >
                                    <UserPlus className="h-4 w-4 mr-2" />
                                    {createPromotion.isPending ? 'Oluşturuluyor...' : 'Terfi Talebi Oluştur'}
                                </Button>
                                <Link href="/dashboard/part3/tutor-promotions">
                                    <Button type="button" variant="outline">
                                        İptal
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
