'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Phone, FileText, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/contexts/AuthContext';
import { useToast } from '@/app/hooks/use-toast';

interface UserSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
    const { user, refreshUser } = useAuth();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState('profile');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);

    // Profile form state
    const [profileForm, setProfileForm] = useState({
        firstName: '',
        lastName: '',
        phone: '',
        bio: '',
    });

    // Security form state
    const [securityForm, setSecurityForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (open && user) {
            fetchProfile();
        }
    }, [open, user]);

    const fetchProfile = async () => {
        try {
            setFetching(true);
            const res = await fetch('/api/users/profile');
            const data = await res.json();
            if (data.user) {
                setProfileForm({
                    firstName: data.user.firstName || '',
                    lastName: data.user.lastName || '',
                    phone: data.user.phone || '',
                    bio: data.user.bio || '',
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setFetching(false);
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const res = await fetch('/api/users/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(profileForm),
            });

            if (res.ok) {
                toast.success('Profil bilgileriniz güncellendi.');
                await refreshUser();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Profil güncellenemedi.');
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleSecuritySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (securityForm.newPassword !== securityForm.confirmPassword) {
            toast.error('Yeni şifreler eşleşmiyor.');
            return;
        }

        try {
            setLoading(true);
            const res = await fetch('/api/auth/password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: securityForm.currentPassword,
                    newPassword: securityForm.newPassword,
                }),
            });

            if (res.ok) {
                toast.success('Şifreniz güncellendi.');
                setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
            } else {
                const data = await res.json();
                toast.error(data.error || 'Şifre güncellenemedi.');
            }
        } catch (error) {
            toast.error('Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                        Profil Ayarları
                    </DialogTitle>
                    <DialogDescription>
                        Kişisel bilgilerinizi ve hesap güvenliğinizi buradan yönetebilirsiniz.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="profile" className="flex items-center gap-2">
                            <User className="h-4 w-4" /> Profil
                        </TabsTrigger>
                        <TabsTrigger value="security" className="flex items-center gap-2">
                            <Lock className="h-4 w-4" /> Güvenlik
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="profile" className="space-y-4 animate-in fade-in duration-300">
                        {fetching ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                            </div>
                        ) : (
                            <form onSubmit={handleProfileSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">Ad</Label>
                                        <Input
                                            id="firstName"
                                            value={profileForm.firstName}
                                            onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                                            placeholder="Adınız"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Soyad</Label>
                                        <Input
                                            id="lastName"
                                            value={profileForm.lastName}
                                            onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                                            placeholder="Soyadınız"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Telefon</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            id="phone"
                                            className="pl-10"
                                            value={profileForm.phone}
                                            onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                            placeholder="05xx xxx xx xx"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="bio">Hakkımda</Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <textarea
                                            id="bio"
                                            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                                            value={profileForm.bio}
                                            onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                                            placeholder="Kendinizden bahsedin..."
                                        />
                                    </div>
                                </div>
                                <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                    Değişiklikleri Kaydet
                                </Button>
                            </form>
                        )}
                    </TabsContent>

                    <TabsContent value="security" className="space-y-4 animate-in fade-in duration-300">
                        <form onSubmit={handleSecuritySubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                                <Input
                                    id="currentPassword"
                                    type="password"
                                    value={securityForm.currentPassword}
                                    onChange={(e) => setSecurityForm({ ...securityForm, currentPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Yeni Şifre</Label>
                                <Input
                                    id="newPassword"
                                    type="password"
                                    value={securityForm.newPassword}
                                    onChange={(e) => setSecurityForm({ ...securityForm, newPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    value={securityForm.confirmPassword}
                                    onChange={(e) => setSecurityForm({ ...securityForm, confirmPassword: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                            <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                Şifreyi Güncelle
                            </Button>
                        </form>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
