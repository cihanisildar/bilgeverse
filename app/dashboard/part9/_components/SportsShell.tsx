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
    /** `basePath`'e eklenen göreli yol; '' genel bakış sayfasıdır. */
    path: string;
    /** Only visible to managers (admin/coach). Athletes get a reduced menu. */
    managerOnly?: boolean;
    /** Only visible to athletes (their own read-only view). */
    athleteOnly?: boolean;
    /** Kulübe kayıtlı olmayan öğrencilere gösterilir (sporcunun "Panelim"inin yerine). */
    visitorOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
    { label: 'Panelim', icon: LayoutDashboard, path: '/me', athleteOnly: true },
    // Aynı sayfa: kayıtsız öğrenci kişisel değil, kulübün genel görünümünü alır.
    { label: 'Kulüp', icon: LayoutDashboard, path: '/me', visitorOnly: true },
    { label: 'Genel Bakış', icon: LayoutDashboard, path: '', managerOnly: true },
    { label: 'Sporcular', icon: Users, path: '/athletes', managerOnly: true },
    { label: 'Branşlar', icon: Dumbbell, path: '/branches', managerOnly: true },
    { label: 'Antrenman', icon: CalendarDays, path: '/schedule' },
    { label: 'Katılım', icon: ClipboardCheck, path: '/attendance-overview', managerOnly: true },
    { label: 'Performans', icon: LineChart, path: '/performance', managerOnly: true },
    { label: 'Turnuvalar', icon: Trophy, path: '/tournaments' },
    { label: 'Disiplin', icon: Gavel, path: '/discipline', managerOnly: true },
    // Sporcu tarafı: kendi kayıtları + yönetmelik (salt okunur, ayrı sayfa).
    { label: 'Disiplin', icon: Gavel, path: '/my-discipline', athleteOnly: true },
    { label: 'Ekipman', icon: Package, path: '/equipment', managerOnly: true },
    { label: 'Futbol Okulu', icon: CircleDollarSign, path: '/football-school', managerOnly: true },
    { label: 'Maliye', icon: Wallet, path: '/finance', managerOnly: true },
    { label: 'Duyurular', icon: Megaphone, path: '/announcements' },
    { label: 'Geri Bildirim', icon: MessageSquare, path: '/feedback' },
    { label: 'Raporlar', icon: FileBarChart, path: '/reports', managerOnly: true },
    { label: 'Belgeler', icon: FolderOpen, path: '/documents' },
];

/**
 * Spor Kulübü'nün sayfa İÇİ menüsü.
 *
 * Modülün Bilgeverse (part7) içindeki ikinci girişi kaldırıldı — Spor Kulübü
 * Paket 3'e ait, Bilgeverse Paket 1. `basePath` yine de parametre: kabuk tek
 * yerden (/dashboard/part9) kullanılıyor ama linkler sabit yazılmasın diye.
 */
export default function SportsShell({
    children,
    basePath = '/dashboard/part9',
    backHref = '/dashboard',
}: {
    children: React.ReactNode;
    basePath?: string;
    /** null verilirse "geri dön" bağlantısı gizlenir (kabuk zaten menü sunuyorsa). */
    backHref?: string | null;
}) {
    const pathname = usePathname();
    const { user } = useAuth();

    const roles = user?.roles && user.roles.length > 0 ? user.roles : user?.role ? [user.role] : [];
    const isManager = roles.some((r) =>
        ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN, UserRole.BOARD_MEMBER] as UserRole[]).includes(r as UserRole)
    );

    // Spor Kulübü tüm öğrencilere açık; kişisel bölümler (Panelim, Disiplin)
    // yalnız kulübe kayıtlı sporculara. Kayıt sporcu rolünü de ekliyor
    // (upsertAthleteProfile / registerNewAthlete).
    const isAthlete = roles.includes((UserRole as any).ATHLETE);

    const items = NAV_ITEMS.filter((item) => {
        if (item.managerOnly) return isManager;
        if (item.athleteOnly) return !isManager && isAthlete;
        if (item.visitorOnly) return !isManager && !isAthlete;
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    {backHref && (
                        <Link href={backHref}>
                            <Button variant="ghost" className="mb-4 -ml-2 text-gray-500 hover:text-indigo-600">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Ana Sayfaya Dön
                            </Button>
                        </Link>
                    )}
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
                                const href = `${basePath}${item.path}`;
                                const active = item.path === '' ? pathname === href : pathname.startsWith(href);
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={href}
                                        href={href}
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
