'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import Link from 'next/link';
import { Button } from "../../../components/ui/button";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import { LogOut, LayoutDashboard, Users, FileText, Calendar, ShoppingBag, PieChart, GraduationCap, Trophy, ShoppingCart, ClipboardList, School, Award, TrendingUp, Menu, Bell, Clock, BookOpen, Grid3x3, Home, Settings, Building2 } from "lucide-react";
import { UserRole } from '@prisma/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../../components/ui/sheet";

// Define the type for navigation links
interface NavLink {
  href?: string;
  label?: string;
  icon?: React.ReactNode;
  isSeparator?: boolean;
  isSectionHeader?: boolean;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading, isAdmin, isBoardMember, isTutor, isStudent, isInAcademy, logout } = useAuth();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Middleware already handles authentication and redirects - no client-side check needed

  // Function to check if a link is active - fix the issue with exact comparison
  const isActive = (path: string) => {
    // For root paths like /dashboard/part7/admin, /dashboard/part7/tutor, /dashboard/part7/student, only match exactly
    if (path === '/dashboard/part7/admin' || path === '/dashboard/part7/tutor' || path === '/dashboard/part7/student') {
      return pathname === path;
    }
    // For subpaths, match if pathname starts with the path
    return pathname?.startsWith(path);
  };

  const userRoles = user?.roles || [];
  const hasBoardMember = isBoardMember;

  // Define navigation links based on role with Lucide icons
  const adminLinks: NavLink[] = [
    { href: '/dashboard/part7/admin', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/periods', label: 'Dönem Yönetimi', icon: <Clock className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/announcements', label: 'Duyuru Panosu', icon: <Bell className="h-5 w-5" /> },

    { isSectionHeader: true, label: 'Karakter Eğitim Grupları' },
    { href: '/dashboard/part7/admin/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/weekly-reports', label: 'Haftalık Raporlar', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/reports', label: 'Raporlar', icon: <PieChart className="h-5 w-5" /> },

    { isSectionHeader: true, label: 'Bilgeverse' },
    { href: '/dashboard/part7/admin/points', label: 'Puan Yönetimi', icon: <Award className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/point-reasons', label: 'Puan Kriteri Oluşturma', icon: <FileText className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/experience', label: 'Tecrübe Yönetimi', icon: <TrendingUp className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/store', label: 'Mağaza Yönetimi', icon: <ShoppingBag className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/requests', label: 'Ürün Talepleri', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/dashboard/part7/admin/wishes', label: 'İstek ve Dilekler', icon: <ClipboardList className="h-5 w-5" /> },

    { isSectionHeader: true, label: 'Gençlik Merkezi' },
    { href: '/dashboard/part7/admin/users', label: 'Kullanıcı Yönetimi', icon: <Users className="h-5 w-5" /> },
  ];

  const tutorLinks: NavLink[] = [
    { href: '/dashboard/part7/tutor', label: 'Rehber Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/students', label: 'Grubum', icon: <Users className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/education', label: 'Eğitim İçerikleri', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/workshops', label: 'Atölyeler', icon: <Grid3x3 className="h-5 w-5" /> },
    { isSeparator: true },
    { href: '/dashboard/part7/tutor/weekly-reports', label: 'Haftalık İlerleme Raporu', icon: <FileText className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/tips', label: 'Nasıl Bilge Para Kazanılır', icon: <TrendingUp className="h-5 w-5" /> },
    { href: '/dashboard/part7/tutor/store', label: 'Öğrenci Mağazası', icon: <ShoppingCart className="h-5 w-5" /> },
    ...(isInAcademy ? [{ href: '/dashboard/part7/student/academy', label: 'Akademi', icon: <GraduationCap className="h-5 w-5" /> } as NavLink] : []),
    ...(hasBoardMember ? [{ href: '/dashboard/part1', label: 'Yönetim Kurulu', icon: <Building2 className="h-5 w-5" /> } as NavLink] : []),
    { href: '/dashboard/part7/tutor/settings', label: 'Ayarlar', icon: <Settings className="h-5 w-5" /> },
  ];

  const studentLinks: NavLink[] = [
    { href: '/dashboard/part7/student', label: 'Öğrenci Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/dashboard/part7/student/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/dashboard/part7/student/store', label: 'Mağaza', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/dashboard/part7/student/workshops', label: 'Atölyeler', icon: <Grid3x3 className="h-5 w-5" /> },
    { href: '/dashboard/part7/student/academy', label: 'Akademi', icon: <GraduationCap className="h-5 w-5" /> },
    { isSeparator: true },
    { href: '/dashboard/part7/student/tips', label: 'Nasıl Bilge Para Kazanırım', icon: <TrendingUp className="h-5 w-5" /> },
  ];

  // Determine which set of links to show based on user role AND path
  let navLinks: NavLink[] = [];

  const hasAdmin = isAdmin;
  const hasTutor = isTutor;
  const hasStudent = isStudent;
  const hasBoard = isBoardMember;

  if (hasAdmin && pathname?.startsWith('/dashboard/part7/admin')) {
    navLinks = adminLinks;
  } else if (hasTutor && pathname?.startsWith('/dashboard/part7/tutor')) {
    navLinks = tutorLinks;
  } else if (hasStudent && pathname?.startsWith('/dashboard/part7/student')) {
    navLinks = studentLinks;
  } else if (hasAdmin) {
    navLinks = adminLinks;
  } else if (hasTutor) {
    navLinks = tutorLinks;
  } else if (hasStudent) {
    navLinks = studentLinks;
  } else if (hasBoard) {
    // Board members see tutor links by default if they have no other role
    navLinks = tutorLinks;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Safety check for access
  if (!hasAdmin && !hasTutor && !hasStudent && !hasBoard) {
    return null;
  }

  // Determine sidebar title based on current path
  let sidebarTitle = "";
  let activeLinkColor = "";
  let activeIconBg = "";

  if (pathname?.startsWith('/dashboard/part7/admin')) {
    sidebarTitle = "Yönetici Paneli";
    activeLinkColor = "text-indigo-600";
    activeIconBg = "bg-indigo-100";
  } else if (pathname?.startsWith('/dashboard/part7/tutor')) {
    sidebarTitle = "Rehber Paneli";
    activeLinkColor = "text-blue-600";
    activeIconBg = "bg-blue-100";
  } else if (pathname?.startsWith('/dashboard/part7/student')) {
    sidebarTitle = "Öğrenci Paneli";
    activeLinkColor = "text-teal-600";
    activeIconBg = "bg-teal-100";
  } else {
    sidebarTitle = isAdmin ? "Yönetici Paneli" : isTutor ? "Rehber Paneli" : "Öğrenci Paneli";
    activeLinkColor = isAdmin ? "text-indigo-600" : isTutor ? "text-blue-600" : "text-teal-600";
    activeIconBg = isAdmin ? "bg-indigo-100" : isTutor ? "bg-blue-100" : "bg-teal-100";
  }

  const NavigationLinks = ({ forceExpanded = false }: { forceExpanded?: boolean }) => (
    <ul className="space-y-1">
      {(!isStudent || isBoardMember) && (
        <li>
          <Link
            href="/dashboard"
            className={`flex items-center justify-start px-4 py-2 rounded-lg transition-all duration-200 ${pathname === '/dashboard'
              ? `${activeIconBg} ${activeLinkColor} font-medium`
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
              }`}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <div className="flex-shrink-0 mr-3">
              <Grid3x3 className="h-5 w-5" />
            </div>
            <span className="truncate text-sm tracking-wide">Bölümlere Dön</span>
          </Link>
        </li>
      )}

      {/* Cross-panel navigation for multi-role users */}
      {isTutor && isStudent && (
        <>
          {pathname.includes('/tutor') ? (
            <li>
              <Link
                href="/dashboard/part7/student"
                className="flex items-center justify-start px-4 py-2 rounded-lg text-teal-600 hover:bg-teal-50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex-shrink-0 mr-3">
                  <School className="h-5 w-5" />
                </div>
                <span className="truncate text-sm font-medium">Öğrenci Paneline Geç</span>
              </Link>
            </li>
          ) : (
            <li>
              <Link
                href="/dashboard/part7/tutor"
                className="flex items-center justify-start px-4 py-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="flex-shrink-0 mr-3">
                  <School className="h-5 w-5" />
                </div>
                <span className="truncate text-sm font-medium">Rehber Paneline Geç</span>
              </Link>
            </li>
          )}
          <li className="py-1 px-2">
            <div className="border-t border-gray-100" />
          </li>
        </>
      )}
      {navLinks.map((link, index) => {
        if (link.isSeparator) {
          return (
            <li key={`sep-${index}`} className="py-1 px-2">
              <div className="border-t border-gray-100" />
            </li>
          );
        }
        if (link.isSectionHeader) {
          return (
            <li key={`header-${index}`} className="px-4 pt-4 pb-1">
              {(isExpanded || forceExpanded) ? (
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest truncate">
                  {link.label}
                </span>
              ) : (
                <div className="border-t border-gray-100" />
              )}
            </li>
          );
        }
        return (
          <li key={link.href}>
            <Link
              href={link.href!}
              className={`flex items-center justify-start px-4 py-2 rounded-lg transition-all duration-200 ${isActive(link.href!)
                ? `${activeIconBg} ${activeLinkColor} font-medium`
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <div className="flex-shrink-0 mr-3">
                {link.icon}
              </div>
              <span className="truncate text-sm tracking-wide">{link.label}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const UserProfile = ({ expanded = true }) => (
    <div className={`flex ${expanded ? 'items-center px-3' : 'justify-center'}`}>
      <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-600 flex-shrink-0" title={user?.username}>
        <AvatarFallback>
          {user?.username?.charAt(0).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {expanded && (
        <>
          <div className="ml-3 overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate tracking-wide">{user?.username}</p>
            <p className="text-xs text-gray-500 tracking-wide">
              {(() => {
                const roles = user?.roles || [user?.role].filter(Boolean) as UserRole[];
                if (roles.includes(UserRole.ADMIN)) return 'Yönetici';
                if (roles.includes(UserRole.TUTOR)) return 'Rehber';
                if (roles.includes(UserRole.ASISTAN)) return 'Lider';
                if (roles.includes((UserRole as any).ATHLETE)) return 'Sporcu';
                return 'Öğrenci';
              })()}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              setIsMobileMenuOpen(false);
              logout();
            }}
            className="ml-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            title="Çıkış Yap"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-100 z-20 flex items-center px-4">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-4">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[300px] p-0 z-50">
            <SheetHeader className="border-b border-gray-100 p-5">
              <SheetTitle className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                {sidebarTitle}
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col h-[calc(100vh-80px)]">
              <div className="flex-1 py-4 px-3 overflow-y-auto">
                <NavigationLinks forceExpanded />
              </div>
              <div className="p-3 border-t border-gray-100 bg-white">
                <div className="flex items-center px-3">
                  <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-600 flex-shrink-0">
                    <AvatarFallback>
                      {user?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 overflow-hidden">
                    <p className="text-sm font-medium text-gray-800 truncate tracking-wide">{user?.username}</p>
                    <p className="text-xs text-gray-500 tracking-wide">
                      {(() => {
                        const roles = user?.roles || [user?.role].filter(Boolean) as UserRole[];
                        if (roles.includes(UserRole.ADMIN)) return 'Yönetici';
                        if (roles.includes(UserRole.TUTOR)) return 'Rehber';
                        if (roles.includes(UserRole.ASISTAN)) return 'Lider';
                        if (roles.includes((UserRole as any).ATHLETE)) return 'Sporcu';
                        return 'Öğrenci';
                      })()}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      logout();
                    }}
                    className="ml-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                    title="Çıkış Yap"
                  >
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
          {sidebarTitle}
        </h1>
      </div>

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:block fixed top-0 left-0 bottom-0 ${isExpanded ? 'w-[240px]' : 'w-[60px]'} h-full bg-white border-r border-gray-100 shadow-sm z-10 transition-all duration-300 ease-in-out`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <div className="h-1 w-full bg-indigo-600"></div>
        <div className="flex flex-col h-full">
          <div className={`border-b border-gray-100 flex ${isExpanded ? 'justify-start p-5' : 'justify-center p-4'}`}>
            {isExpanded ? (
              <h1 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 whitespace-nowrap tracking-tight">
                {sidebarTitle}
              </h1>
            ) : (
              <span className="text-lg font-semibold text-indigo-600">
                {sidebarTitle.charAt(0)}
              </span>
            )}
          </div>
          <div className="flex-1 py-4 overflow-y-auto">
            <NavigationLinks />
          </div>
          <div className="p-3 border-t border-gray-100">
            <UserProfile expanded={isExpanded} />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded ? 'lg:ml-[240px]' : 'lg:ml-[60px]'} ${pathname !== '/' ? 'mt-16 lg:mt-0' : ''}`}>
        <main className="">
          {children}
        </main>
      </div>
    </div>
  );
}
