'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Users, UserCheck, Dumbbell, CalendarDays, Trophy, IdCard,
    HeartPulse, Wallet, MessageSquare, Megaphone, Share2, AlertTriangle, ArrowRight,
} from 'lucide-react';
import { useSportsOverview } from '@/app/hooks/use-sports';
import { getAnnouncementTypeMeta } from '@/app/lib/sports';
import { format } from 'date-fns';
import type { SportsOverviewData } from '@/types/sports';

const STAT_CARDS = (d: SportsOverviewData) => [
    { label: 'Toplam Sporcu', value: d.totalAthletes, icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Aktif Sporcu', value: d.activeAthletes, icon: UserCheck, color: 'text-green-600 bg-green-50' },
    { label: 'Branş', value: d.branchCount, icon: Dumbbell, color: 'text-amber-600 bg-amber-50' },
    { label: 'Yaklaşan Antrenman', value: d.upcomingTrainings, icon: CalendarDays, color: 'text-blue-600 bg-blue-50' },
    { label: 'Yaklaşan Maç', value: d.upcomingMatches, icon: Trophy, color: 'text-purple-600 bg-purple-50' },
];

export default function SportsOverview() {
    const { data, isLoading: loading } = useSportsOverview();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {Array(6).fill(0).map((_, i) => (
                    <Card key={i} className="animate-pulse h-24 bg-gray-100 border-0" />
                ))}
            </div>
        );
    }

    if (!data) {
        return <p className="text-gray-500">Genel bakış verisi yüklenemedi.</p>;
    }

    const alerts: { label: string; count: number; href: string; icon: any; color: string }[] = [];
    if (data.duesOutstanding > 0)
        alerts.push({ label: 'Aidat borcu olan kayıt', count: data.duesOutstanding, href: '/dashboard/part9/football-school', icon: Wallet, color: 'border-red-200 bg-red-50 text-red-700' });
    if (data.expiringLicenses > 0)
        alerts.push({ label: 'Lisans süresi yaklaşan', count: data.expiringLicenses, href: '/dashboard/part9/athletes', icon: IdCard, color: 'border-amber-200 bg-amber-50 text-amber-700' });
    if (data.expiringHealth > 0)
        alerts.push({ label: 'Sağlık raporu süresi yaklaşan', count: data.expiringHealth, href: '/dashboard/part9/athletes', icon: HeartPulse, color: 'border-orange-200 bg-orange-50 text-orange-700' });
    if (data.newFeedback > 0)
        alerts.push({ label: 'Yeni geri bildirim', count: data.newFeedback, href: '/dashboard/part9/feedback', icon: MessageSquare, color: 'border-blue-200 bg-blue-50 text-blue-700' });

    return (
        <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {STAT_CARDS(data).map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className="border-gray-100 shadow-sm">
                            <CardContent className="p-4">
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-2xl font-extrabold text-gray-900 leading-none">{s.value}</p>
                                <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div>
                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" /> Dikkat Gerektirenler
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {alerts.map((a) => {
                            const Icon = a.icon;
                            return (
                                <Link key={a.label} href={a.href}>
                                    <div className={`flex items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${a.color}`}>
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-5 w-5" />
                                            <span className="text-sm font-semibold">{a.label}</span>
                                        </div>
                                        <Badge className="bg-white/70 text-gray-800 border-0">{a.count}</Badge>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Recent announcements + social link */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="border-gray-100 shadow-sm">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                <Megaphone className="h-4 w-4 text-indigo-500" /> Son Duyurular
                            </h3>
                            <Link href="/dashboard/part9/announcements" className="text-xs font-semibold text-indigo-600 hover:underline">
                                Tümü
                            </Link>
                        </div>
                        {data.recentAnnouncements.length === 0 ? (
                            <p className="text-sm text-gray-400">Henüz duyuru yok.</p>
                        ) : (
                            <ul className="space-y-3">
                                {data.recentAnnouncements.map((a) => {
                                    const meta = getAnnouncementTypeMeta(a.type);
                                    return (
                                        <li key={a.id} className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">{a.title}</p>
                                                <p className="text-xs text-gray-400">
                                                    {format(new Date(a.createdAt), 'dd.MM.yyyy')}
                                                    {a.branch ? ` · ${a.branch.name}` : ''}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm bg-gradient-to-br from-pink-50 to-indigo-50">
                    <CardContent className="p-5 flex flex-col justify-between h-full">
                        <div>
                            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
                                <Share2 className="h-4 w-4 text-pink-500" /> Spor Kulübü Sosyal Medya
                            </h3>
                            <p className="text-sm text-gray-600">
                                Spor kulübüne ait sosyal medya içerikleri genel Sosyal Medya modülünde
                                etiketli olarak yönetilir.
                            </p>
                        </div>
                        <Link href="/dashboard/part6/posts?filter=sports" className="mt-4">
                            <Button variant="outline" className="border-pink-200 text-pink-700 hover:bg-pink-50">
                                Spor İçeriklerine Git <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
