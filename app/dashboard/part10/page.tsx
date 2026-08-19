import { requireAuth } from '@/app/lib/auth-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft, ArrowRight, Package, ClipboardList, AlarmClock, FileText, UserPlus, BellRing,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { getRecurringReminders } from '@/app/actions/center';
import { daysUntil, repeatShortLabel } from '@/app/lib/recurring';

const CENTER_MODULES = [
    { href: '/dashboard/part10/inventory', title: 'Demirbaş Listesi', desc: 'Masa, sandalye, bilgisayar vb. envanteri yönetin', icon: Package, from: 'from-emerald-500', to: 'to-teal-500', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { href: '/dashboard/part10/tasks', title: 'Görev Takibi', desc: 'Dernek müdürü iş takibi (to-do list)', icon: ClipboardList, from: 'from-indigo-500', to: 'to-blue-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { href: '/dashboard/part10/recurring', title: 'Süreli İşler', desc: 'Kira zammı, abonelik yenileme; hedef tarihte kırmızı yanar', icon: AlarmClock, from: 'from-rose-500', to: 'to-pink-500', bg: 'bg-rose-100', text: 'text-rose-600' },
    { href: '/dashboard/part10/guidelines', title: 'Yönergeler', desc: 'Personel alımı, dernek defterleri, DERBİS yönergeleri', icon: FileText, from: 'from-amber-500', to: 'to-orange-500', bg: 'bg-amber-100', text: 'text-amber-600' },
    { href: '/dashboard/part10/admin', title: 'Oryantasyon', desc: 'Yeni öğrenci oryantasyon süreci', icon: UserPlus, from: 'from-violet-500', to: 'to-purple-500', bg: 'bg-violet-100', text: 'text-violet-600' },
];

// NOT: "Dernek Yönetimi" kartları (Duyuru Panosu, Dönem Yönetimi, İstek ve
// Dilekler, Raporlar, Kullanıcı Yönetimi) buradan kaldırıldı — bunlar Paket 1
// (Bilgeverse) kapsamındadır ve part7 admin sidebar'ından erişilir.

function ModuleCard({ m }: { m: typeof CENTER_MODULES[number] }) {
    const Icon = m.icon;
    return (
        <Link href={m.href} className="block">
            <Card className="border-0 shadow-lg rounded-xl overflow-hidden transition-all duration-200 hover:shadow-xl hover:-translate-y-1 cursor-pointer bg-white h-full">
                <div className={`h-2 bg-gradient-to-r ${m.from} ${m.to}`} />
                <CardHeader>
                    <div className="flex items-center space-x-4">
                        <div className={`w-14 h-14 flex items-center justify-center rounded-full ${m.bg} ${m.text}`}>
                            <Icon className="h-7 w-7" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{m.title}</CardTitle>
                            <CardDescription className="mt-1 text-xs">{m.desc}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center text-sm font-medium text-gray-600">
                        Git <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}

/**
 * Süreli işlerin hatırlatma şeridi.
 *
 * Müşteri "bu işler bize bir şekilde hatırlatılmalı" dediği için hatırlatma
 * Süreli İşler sayfasının içinde kalmıyor: merkeze girer girmez burada da
 * görünüyor. Her işin kendi "kaç gün önceden" değeri var (RecurringTask.leadDays).
 */
async function ReminderStrip() {
    const res = await getRecurringReminders();
    // serialize() JSON turu attığı için tarihler runtime'da string; statik tip
    // hâlâ Date olduğundan unknown üzerinden çevriliyor.
    const items = (res.data ?? []) as unknown as { id: string; title: string; dueDate: string; repeat: string }[];
    if (items.length === 0) return null;

    return (
        <div className="mb-8 rounded-xl border-2 border-rose-300 bg-rose-50/70 p-4">
            <div className="flex items-center gap-2 mb-3">
                <BellRing className="h-5 w-5 text-rose-600" />
                <p className="font-semibold text-rose-800">Süreli iş hatırlatması — {items.length} işin zamanı geldi</p>
            </div>
            <ul className="space-y-1.5">
                {items.map((t) => {
                    const days = daysUntil(t.dueDate);
                    return (
                        <li key={t.id} className="flex items-center justify-between gap-3 text-sm flex-wrap">
                            <span className="text-gray-800">
                                <span className="font-medium">{t.title}</span>
                                <span className="text-gray-500"> — {format(new Date(t.dueDate), 'd MMMM yyyy', { locale: tr })} · {repeatShortLabel(t.repeat)}</span>
                            </span>
                            <Badge className={days < 0 ? 'bg-red-600 text-white' : 'bg-rose-100 text-rose-700 border-rose-200'}>
                                {days < 0 ? `${Math.abs(days)} gün gecikti` : days === 0 ? 'Bugün' : `${days} gün kaldı`}
                            </Badge>
                        </li>
                    );
                })}
            </ul>
            <Link href="/dashboard/part10/recurring" className="mt-3 inline-flex items-center text-sm font-semibold text-rose-700 hover:underline">
                Süreli İşler&apos;e git <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
        </div>
    );
}

export default async function Part10Page() {
    await requireAuth({ partId: 10 });

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <Link href="/dashboard">
                    <Button variant="ghost" className="mb-6 hover:bg-gray-100"><ArrowLeft className="h-4 w-4 mr-2" />Ana Sayfaya Dön</Button>
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-600">Gençlik Merkezi</span>
                    </h1>
                    <p className="text-gray-600">Merkez yönetimi, demirbaş, görev takibi ve yönergeler</p>
                </div>

                <ReminderStrip />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {CENTER_MODULES.map((m) => <ModuleCard key={m.href} m={m} />)}
                </div>
            </div>
        </div>
    );
}
