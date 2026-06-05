'use client';

import { useMemo, useState } from 'react';
import {
    startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
    format, isSameMonth, isSameDay, addMonths, subMonths, addWeeks, subWeeks,
} from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Loader2, CalendarDays } from 'lucide-react';

import { useSocialPosts, useSocialEvents } from '@/app/hooks/use-social';
import { getPlatformMeta, getStatusMeta, TR_SPECIAL_DAYS } from '@/app/lib/social';

type ViewMode = 'month' | 'week';

const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

export default function SocialCalendar() {
    const { data: posts = [], isLoading } = useSocialPosts();
    const { data: events = [] } = useSocialEvents();
    const [view, setView] = useState<ViewMode>('month');
    const [cursor, setCursor] = useState(new Date());

    const days = useMemo(() => {
        if (view === 'month') {
            const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
            const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
            return eachDayOfInterval({ start, end });
        }
        const start = startOfWeek(cursor, { weekStartsOn: 1 });
        const end = endOfWeek(cursor, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [cursor, view]);

    const postsByDay = useMemo(() => {
        const map = new Map<string, typeof posts>();
        for (const p of posts) {
            if (!p.scheduledDate) continue;
            const key = format(new Date(p.scheduledDate), 'yyyy-MM-dd');
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(p);
        }
        return map;
    }, [posts]);

    const isSpecialDay = (day: Date): string | null => {
        const seed = TR_SPECIAL_DAYS.find((sd) => sd.month === day.getMonth() + 1 && sd.day === day.getDate());
        if (seed) return seed.title;
        const ev = events.find((e) => {
            const d = new Date(e.date);
            if (e.recurring) return d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
            return isSameDay(d, day);
        });
        return ev ? ev.title : null;
    };

    const navigate = (dir: number) => {
        setCursor((c) => (view === 'month' ? addMonths(c, dir) : addWeeks(c, dir)));
    };

    const goPrev = () => setCursor((c) => (view === 'month' ? subMonths(c, 1) : subWeeks(c, 1)));

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={goPrev}><ChevronLeft className="h-4 w-4" /></Button>
                    <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-teal-600" onClick={() => setCursor(new Date())}>Bugün</Button>
                    <h2 className="text-xl font-bold text-gray-800 ml-2">
                        {view === 'month'
                            ? format(cursor, 'LLLL yyyy', { locale: tr })
                            : `${format(startOfWeek(cursor, { weekStartsOn: 1 }), 'd MMM', { locale: tr })} - ${format(endOfWeek(cursor, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: tr })}`}
                    </h2>
                </div>
                <div className="flex items-center gap-1 bg-white border border-teal-100 rounded-lg p-1">
                    <button onClick={() => setView('month')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${view === 'month' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-teal-50'}`}>Aylık</button>
                    <button onClick={() => setView('week')} className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-all ${view === 'week' ? 'bg-teal-600 text-white' : 'text-gray-500 hover:bg-teal-50'}`}>Haftalık</button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>
            ) : (
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                            {WEEKDAYS.map((d) => (
                                <div key={d} className="py-2 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {days.map((day) => {
                                const key = format(day, 'yyyy-MM-dd');
                                const dayPosts = postsByDay.get(key) || [];
                                const special = isSpecialDay(day);
                                const inMonth = view === 'week' || isSameMonth(day, cursor);
                                const today = isSameDay(day, new Date());
                                return (
                                    <div
                                        key={key}
                                        className={`min-h-[110px] border-b border-r border-gray-100 p-1.5 ${inMonth ? 'bg-white' : 'bg-gray-50/40'} ${special ? 'ring-1 ring-inset ring-rose-100' : ''}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-xs font-semibold h-6 w-6 flex items-center justify-center rounded-full ${today ? 'bg-teal-600 text-white' : inMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                                                {format(day, 'd')}
                                            </span>
                                            {special && <span className="text-[9px] text-rose-500 font-medium truncate max-w-[70%]" title={special}>{special}</span>}
                                        </div>
                                        <div className="space-y-1">
                                            {dayPosts.slice(0, view === 'week' ? 8 : 3).map((p) => {
                                                const platform = getPlatformMeta(p.platform);
                                                const status = getStatusMeta(p.status);
                                                return (
                                                    <div key={p.id} className={`text-[10px] px-1.5 py-1 rounded ${platform.bg} ${platform.color} truncate flex items-center gap-1`} title={`${p.title} · ${status.label}`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${status.bg.replace('bg-', 'bg-').replace('-50', '-400').replace('-100', '-400')}`} />
                                                        {p.title}
                                                    </div>
                                                );
                                            })}
                                            {dayPosts.length > (view === 'week' ? 8 : 3) && (
                                                <div className="text-[9px] text-gray-400 px-1">+{dayPosts.length - (view === 'week' ? 8 : 3)} daha</div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Platform renkleri:</span>
                {['INSTAGRAM', 'YOUTUBE', 'TIKTOK', 'TWITTER', 'FACEBOOK', 'LINKEDIN'].map((id) => {
                    const m = getPlatformMeta(id);
                    return <Badge key={id} variant="outline" className={`${m.bg} ${m.color} border-transparent text-[10px]`}>{m.label}</Badge>;
                })}
            </div>
        </div>
    );
}
