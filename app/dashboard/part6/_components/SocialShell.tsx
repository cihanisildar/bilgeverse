'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, Send, CalendarDays, Lightbulb, Sparkles, FileBarChart, FolderOpen, CalendarHeart } from 'lucide-react';

interface NavItem {
    label: string;
    icon: any;
    /** `basePath`'e eklenen göreli yol; '' genel bakış sayfasıdır. */
    path: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Genel Bakış', icon: LayoutDashboard, path: '' },
    { label: 'İçerikler', icon: Send, path: '/posts' },
    { label: 'Takvim', icon: CalendarDays, path: '/calendar' },
    { label: 'Fikir Havuzu', icon: Lightbulb, path: '/ideas' },
    { label: 'Özel Günler', icon: CalendarHeart, path: '/events' },
    { label: 'Bileşenler', icon: Sparkles, path: '/ingredients' },
    { label: 'Raporlar', icon: FileBarChart, path: '/reports' },
    { label: 'Belgeler', icon: FolderOpen, path: '/documents' },
];

/**
 * Sosyal Medya'nın sayfa İÇİ menüsü.
 *
 * `basePath` ile iki yerden kullanılır: kendi modülünde (/dashboard/part6) ve
 * Bilgeverse içindeki ikinci girişinde (/dashboard/part7/social). Bilgeverse
 * sol menüsünde modül TEK satırdır; bölümler arasında gezinme buradan yapılır.
 */
export default function SocialShell({
    children,
    basePath = '/dashboard/part6',
    backHref = '/dashboard',
}: {
    children: React.ReactNode;
    basePath?: string;
    /** null verilirse "geri dön" bağlantısı gizlenir (kabuk zaten menü sunuyorsa). */
    backHref?: string | null;
}) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    {backHref && (
                        <Link href={backHref}>
                            <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-teal-600">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Ana Sayfaya Dön
                            </Button>
                        </Link>
                    )}
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
                                const href = `${basePath}${item.path}`;
                                const active = item.path === '' ? pathname === href : pathname.startsWith(href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
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
