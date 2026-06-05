'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LayoutDashboard, TrendingUp, TrendingDown, Heart, FileBarChart } from 'lucide-react';

interface NavItem {
    label: string;
    icon: any;
    href: string;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Genel Bakış', icon: LayoutDashboard, href: '/dashboard/part8' },
    { label: 'Gelirler', icon: TrendingUp, href: '/dashboard/part8/income' },
    { label: 'Giderler', icon: TrendingDown, href: '/dashboard/part8/expense' },
    { label: 'Bağışçılar', icon: Heart, href: '/dashboard/part8/donors' },
    { label: 'Raporlar', icon: FileBarChart, href: '/dashboard/part8/reports' },
];

export default function FinanceShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-rose-600">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Maliye</h1>
                    <p className="text-gray-500">Gelir, gider, kasa bakiyesi ve aylık raporları yönetin.</p>
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
                                            ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white shadow-md'
                                            : 'text-gray-600 hover:bg-rose-50 hover:text-rose-700'}`}
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
