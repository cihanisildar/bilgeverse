'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/contexts/AuthContext';
import { UserRole } from '@prisma/client';
import {
    ArrowLeft,
    LayoutDashboard,
    Users,
    Dumbbell,
    CalendarDays,
    ClipboardCheck,
    LineChart,
    Trophy,
    Gavel,
    Package,
    CircleDollarSign,
    Wallet,
    Megaphone,
    MessageSquare,
    FileBarChart,
    FolderOpen,
} from 'lucide-react';

interface NavItem {
    label: string;
    icon: any;
    href: string;
    /** Only visible to managers (admin/coach). Athletes get a reduced menu. */
    managerOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Genel Bakış', icon: LayoutDashboard, href: '/dashboard/part9' },
    { label: 'Sporcular', icon: Users, href: '/dashboard/part9/athletes', managerOnly: true },
    { label: 'Branşlar', icon: Dumbbell, href: '/dashboard/part9/branches', managerOnly: true },
    { label: 'Antrenman', icon: CalendarDays, href: '/dashboard/part9/schedule' },
    { label: 'Katılım', icon: ClipboardCheck, href: '/dashboard/part9/attendance-overview', managerOnly: true },
    { label: 'Performans', icon: LineChart, href: '/dashboard/part9/performance', managerOnly: true },
    { label: 'Turnuvalar', icon: Trophy, href: '/dashboard/part9/tournaments' },
    { label: 'Disiplin', icon: Gavel, href: '/dashboard/part9/discipline' },
    { label: 'Ekipman', icon: Package, href: '/dashboard/part9/equipment', managerOnly: true },
    { label: 'Futbol Okulu', icon: CircleDollarSign, href: '/dashboard/part9/football-school', managerOnly: true },
    { label: 'Maliye', icon: Wallet, href: '/dashboard/part9/finance', managerOnly: true },
    { label: 'Duyurular', icon: Megaphone, href: '/dashboard/part9/announcements' },
    { label: 'Geri Bildirim', icon: MessageSquare, href: '/dashboard/part9/feedback' },
    { label: 'Raporlar', icon: FileBarChart, href: '/dashboard/part9/reports', managerOnly: true },
    { label: 'Belgeler', icon: FolderOpen, href: '/dashboard/part9/documents' },
];

export default function SportsShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { user } = useAuth();

    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole)
    );

    const items = NAV_ITEMS.filter((item) => !item.managerOnly || isManager);

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-indigo-600">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Ana Sayfaya Dön
                        </Button>
                    </Link>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-700 to-indigo-600">
                            Bilge Spor Kulübü
                        </span>
                    </h1>
                    <p className="text-sm sm:text-base text-gray-500">
                        Sporcu, antrenman, müsabaka, disiplin, ekipman, futbol okulu ve kulüp yönetimi.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                    {/* Sidebar nav */}
                    <nav className="lg:sticky lg:top-8 h-max">
                        <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible bg-white rounded-2xl border border-gray-200 p-2 shadow-sm">
                            {items.map((item) => {
                                const active =
                                    item.href === '/dashboard/part9'
                                        ? pathname === item.href
                                        : pathname.startsWith(item.href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
                                            active
                                                ? 'bg-gradient-to-r from-slate-700 to-indigo-600 text-white shadow-md'
                                                : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-700'
                                        }`}
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
