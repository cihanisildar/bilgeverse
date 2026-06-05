'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Send, CalendarDays, Lightbulb, Sparkles, FileBarChart, FolderOpen, CalendarHeart } from 'lucide-react';

interface NavItem {
    label: string;
    icon: any;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Genel Bakış', icon: LayoutDashboard, href: '/dashboard/part6' },
    { label: 'İçerikler', icon: Send, href: '/dashboard/part6/posts' },
    { label: 'Takvim', icon: CalendarDays, href: '/dashboard/part6/calendar' },
    { label: 'Fikir Havuzu', icon: Lightbulb, href: '/dashboard/part6/ideas' },
    { label: 'Özel Günler', icon: CalendarHeart, href: '/dashboard/part6/events' },
    { label: 'Bileşenler', icon: Sparkles, href: '/dashboard/part6/ingredients' },
    { label: 'Raporlar', icon: FileBarChart, href: '/dashboard/part6/reports' },
    { label: 'Belgeler', icon: FolderOpen, href: '/dashboard/part6/documents' },
];

export default function SocialShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-teal-600">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">
                            Sosyal Medya
                        </span>
                    </h1>
                    <p className="text-gray-500">İçerik planlama, takvim, fikir havuzu, hatırlatmalar ve raporlar.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                    {/* Sidebar nav */}
                    <nav className="lg:sticky lg:top-8 h-max">
                        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
                            {NAV_ITEMS.map((item) => {
                                const active = pathname === item.href;
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${active
                                            ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-teal-50 hover:text-teal-700'}`}
                                    >
                                        <Icon className="h-4 w-4 flex-shrink-0" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </div>
                    </nav>

                    {/* Content */}
                    <div className="min-w-0">{children}</div>
                </div>
            </div>
        </div>
    );
}
