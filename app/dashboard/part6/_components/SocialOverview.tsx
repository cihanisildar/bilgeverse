'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, FileText, CalendarCheck, BarChart3, Bell, Plus, ArrowRight, CalendarHeart } from 'lucide-react';

import { useSocialPosts, useUpcomingReminders, useCreateSocialPost } from '@/app/hooks/use-social';
import { getPlatformMeta, getStatusMeta, getEventTypeMeta } from '@/app/lib/social';
import { PostStatus } from '@prisma/client';

export default function SocialOverview() {
    const { data: posts = [], isLoading: postsLoading } = useSocialPosts();
    const { data: reminders = [], isLoading: remindersLoading } = useUpcomingReminders(30);
    const createPost = useCreateSocialPost();

    const now = new Date();
    const thisMonth = posts.filter((p) => {
        const d = p.scheduledDate ? new Date(p.scheduledDate) : new Date(p.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });

    const stats = [
        { label: 'Toplam İçerik', value: posts.length, icon: Send, color: 'text-teal-600', bg: 'bg-teal-50' },
        { label: 'Bu Ay Planlanan', value: thisMonth.length, icon: CalendarCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Taslak', value: posts.filter((p) => p.status === PostStatus.DRAFT).length, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
        { label: 'Paylaşılan', value: posts.filter((p) => p.status === PostStatus.PUBLISHED).length, icon: BarChart3, color: 'text-violet-600', bg: 'bg-violet-50' },
    ];

    const recentPosts = [...posts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

    const handleCreateDraft = (title: string, dateIso: string) => {
        createPost.mutate({
            title: `${title} - İçerik`,
            content: '',
            platform: getPlatformMeta('INSTAGRAM').id,
            status: PostStatus.DRAFT,
            scheduledDate: dateIso,
            hashtags: [],
        });
    };

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card key={s.label} className="border-0 shadow-sm">
                            <CardContent className="p-5 flex items-center gap-4">
                                <div className={`h-12 w-12 rounded-xl ${s.bg} ${s.color} flex items-center justify-center`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="text-2xl font-bold text-gray-900">{postsLoading ? '—' : s.value}</div>
                                    <div className="text-xs text-gray-500 font-medium">{s.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upcoming reminders */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Bell className="h-5 w-5 text-amber-500" />
                            Yaklaşan Hatırlatmalar
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {remindersLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                        ) : reminders.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                <CalendarHeart className="h-10 w-10 mx-auto mb-2 text-gray-200" />
                                Önümüzdeki 30 günde özel gün/etkinlik yok.
                            </div>
                        ) : (
                            reminders.map((r) => {
                                const typeMeta = getEventTypeMeta(r.type);
                                return (
                                    <div key={r.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100 hover:border-amber-200 transition-colors">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className={`${typeMeta.bg} ${typeMeta.color} border-transparent text-[10px] px-1.5`}>{typeMeta.label}</Badge>
                                                <span className="text-sm font-semibold text-gray-800 truncate">{r.title}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                {new Date(r.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })} ·{' '}
                                                <span className={r.daysUntil <= 7 ? 'text-amber-600 font-bold' : ''}>
                                                    {r.daysUntil === 0 ? 'Bugün' : `${r.daysUntil} gün kaldı`}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-teal-600 border-teal-200 hover:bg-teal-50 flex-shrink-0"
                                            disabled={createPost.isPending}
                                            onClick={() => handleCreateDraft(r.title, r.date)}
                                        >
                                            <Plus className="h-3.5 w-3.5 mr-1" /> Taslak
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                        <Link href="/dashboard/part6/events">
                            <Button variant="ghost" size="sm" className="w-full text-gray-500 mt-2">
                                Özel Günleri Yönet <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Recent posts */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Send className="h-5 w-5 text-teal-600" />
                            Son Eklenen İçerikler
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {postsLoading ? (
                            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-teal-600" /></div>
                        ) : recentPosts.length === 0 ? (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                Henüz içerik yok.
                                <div className="mt-3">
                                    <Link href="/dashboard/part6/posts">
                                        <Button size="sm" className="bg-teal-600 text-white"><Plus className="h-3.5 w-3.5 mr-1" /> İlk İçeriği Oluştur</Button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            recentPosts.map((p) => {
                                const platform = getPlatformMeta(p.platform);
                                const status = getStatusMeta(p.status);
                                return (
                                    <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-gray-800 truncate">{p.title}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={`${platform.bg} ${platform.color} border-transparent text-[10px] px-1.5`}>{platform.label}</Badge>
                                                <Badge variant="outline" className={`${status.bg} ${status.color} border-transparent text-[10px] px-1.5`}>{status.label}</Badge>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 flex-shrink-0">
                                            {p.createdBy.firstName || p.createdBy.username}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                        <Link href="/dashboard/part6/posts">
                            <Button variant="ghost" size="sm" className="w-full text-gray-500 mt-2">
                                Tüm İçerikler <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
