import { requireAuth } from '@/app/lib/auth-utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowLeft, ArrowRight, Package, ClipboardList, AlarmClock, FileText, UserPlus,
    Bell, Clock, MessageSquare, PieChart, Users,
} from 'lucide-react';

const CENTER_MODULES = [
    { href: '/dashboard/part10/inventory', title: 'Demirbaş Listesi', desc: 'Masa, sandalye, bilgisayar vb. envanteri yönetin', icon: Package, from: 'from-emerald-500', to: 'to-teal-500', bg: 'bg-emerald-100', text: 'text-emerald-600' },
    { href: '/dashboard/part10/tasks', title: 'Görev Takibi', desc: 'Dernek müdürü iş takibi (to-do list)', icon: ClipboardList, from: 'from-indigo-500', to: 'to-blue-500', bg: 'bg-indigo-100', text: 'text-indigo-600' },
    { href: '/dashboard/part10/recurring', title: 'Süreli İşler', desc: 'Kira zammı, abonelik yenileme; hedef tarihte kırmızı yanar', icon: AlarmClock, from: 'from-rose-500', to: 'to-pink-500', bg: 'bg-rose-100', text: 'text-rose-600' },
    { href: '/dashboard/part10/guidelines', title: 'Yönergeler', desc: 'Personel alımı, dernek defterleri, DERBİS yönergeleri', icon: FileText, from: 'from-amber-500', to: 'to-orange-500', bg: 'bg-amber-100', text: 'text-amber-600' },
    { href: '/dashboard/part10/admin', title: 'Oryantasyon', desc: 'Yeni öğrenci oryantasyon süreci', icon: UserPlus, from: 'from-violet-500', to: 'to-purple-500', bg: 'bg-violet-100', text: 'text-violet-600' },
];

// Moved here from "Bilgeverse" per the reorganisation (routes stay under part7 admin)
const MOVED_MODULES = [
    { href: '/dashboard/part7/admin/announcements', title: 'Duyuru Panosu', desc: 'Duyuruları yönetin', icon: Bell, from: 'from-blue-500', to: 'to-cyan-500', bg: 'bg-blue-100', text: 'text-blue-600' },
    { href: '/dashboard/part7/admin/periods', title: 'Dönem Yönetimi', desc: 'Dönemleri yönetin', icon: Clock, from: 'from-teal-500', to: 'to-emerald-500', bg: 'bg-teal-100', text: 'text-teal-600' },
    { href: '/dashboard/part7/admin/wishes', title: 'İstek ve Dilekler', desc: 'Gençlerin istek ve dilekleri', icon: MessageSquare, from: 'from-fuchsia-500', to: 'to-pink-500', bg: 'bg-fuchsia-100', text: 'text-fuchsia-600' },
    { href: '/dashboard/part7/admin/reports', title: 'Raporlar', desc: 'Genel raporlar', icon: PieChart, from: 'from-cyan-500', to: 'to-sky-500', bg: 'bg-cyan-100', text: 'text-cyan-600' },
    { href: '/dashboard/part7/admin/users', title: 'Kullanıcı Yönetimi', desc: 'Dernek üyeleri / kullanıcılar', icon: Users, from: 'from-slate-500', to: 'to-gray-500', bg: 'bg-slate-100', text: 'text-slate-600' },
];

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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                    {CENTER_MODULES.map((m) => <ModuleCard key={m.href} m={m} />)}
                </div>

                <h2 className="text-xl font-bold text-gray-800 mb-4">Dernek Yönetimi</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOVED_MODULES.map((m) => <ModuleCard key={m.href} m={m} />)}
                </div>
            </div>
        </div>
    );
}
