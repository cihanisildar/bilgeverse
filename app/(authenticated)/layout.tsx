'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { LogOut, LayoutDashboard, Users, FileText, Calendar, ShoppingBag, PieChart, GraduationCap, Trophy, ShoppingCart, ClipboardList, School, Award, TrendingUp, Menu, CreditCard, Bell, Clock, BookOpen } from "lucide-react";
import { UserRole } from '@prisma/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../../components/ui/sheet";

// Define the type for navigation links
interface NavLink {
  href: string;
  label: string;
  icon: React.ReactNode;
}

export default function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading, isAdmin, isTutor, isStudent, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Function to check if a link is active - fix the issue with exact comparison
  const isActive = (path: string) => {
    // For root paths like /admin, /tutor, /student, only match exactly
    if (path === '/admin' || path === '/tutor' || path === '/student') {
      return pathname === path;
    }
    // For subpaths, match if pathname starts with the path
    return pathname?.startsWith(path);
  };

  // Define navigation links based on role with Lucide icons
  const adminLinks: NavLink[] = [
    { href: '/admin', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/admin/periods', label: 'Dönem Yönetimi', icon: <Clock className="h-5 w-5" /> },
    { href: '/admin/announcements', label: 'Duyuru Panosu', icon: <Bell className="h-5 w-5" /> },
    { href: '/admin/users', label: 'Kullanıcı Yönetimi', icon: <Users className="h-5 w-5" /> },
    // { href: '/admin/registration-requests', label: 'Kayıt İstekleri', icon: <FileText className="h-5 w-5" /> },
    { href: '/admin/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/admin/points', label: 'Puan Yönetimi', icon: <Award className="h-5 w-5" /> },
    { href: '/admin/point-reasons', label: 'Puan Sebepleri', icon: <FileText className="h-5 w-5" /> },
    { href: '/admin/experience', label: 'Tecrübe Yönetimi', icon: <TrendingUp className="h-5 w-5" /> },
    { href: '/admin/store', label: 'Mağaza Yönetimi', icon: <ShoppingBag className="h-5 w-5" /> },
    { href: '/admin/point-cards', label: 'Puan Kartları', icon: <Award className="h-5 w-5" /> },
    { href: '/admin/transactions/rollback', label: 'İşlem Geri Alma', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/admin/wishes', label: 'İstek ve Dilekler', icon: <ClipboardList className="h-5 w-5" /> },
    { href: '/admin/weekly-reports', label: 'Haftalık Raporlar', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/admin/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/admin/reports', label: 'Raporlar', icon: <PieChart className="h-5 w-5" /> },
  ];

  const tutorLinks: NavLink[] = [
    { href: '/tutor', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/tutor/announcements', label: 'Duyuru Panosu', icon: <Bell className="h-5 w-5" /> },
    { href: '/tutor/students', label: 'Öğrencilerim', icon: <GraduationCap className="h-5 w-5" /> },
    { href: '/tutor/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/tutor/points', label: 'Puan Yönetimi', icon: <Award className="h-5 w-5" /> },
    { href: '/tutor/point-cards', label: 'Puan Kartları', icon: <CreditCard className="h-5 w-5" /> },
    { href: '/tutor/experience', label: 'Tecrübe Yönetimi', icon: <TrendingUp className="h-5 w-5" /> },
    { href: '/tutor/weekly-reports', label: 'Haftalık Raporlar', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/tutor/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/tutor/reports', label: 'Raporlar', icon: <PieChart className="h-5 w-5" /> },
    { href: '/tutor/store', label: 'Mağaza', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/tutor/requests', label: 'Ürün İstekleri', icon: <ClipboardList className="h-5 w-5" /> },
  ];

  const studentLinks: NavLink[] = [
    { href: '/student', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/student/announcements', label: 'Duyuru Panosu', icon: <Bell className="h-5 w-5" /> },
    { href: '/student/classroom', label: 'Sınıfım', icon: <School className="h-5 w-5" /> },
    { href: '/student/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/student/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/student/store', label: 'Mağaza', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/student/requests', label: 'İsteklerim', icon: <ClipboardList className="h-5 w-5" /> },
    { href: '/student/wishes', label: 'Dilek ve İstekler', icon: <FileText className="h-5 w-5" /> },
    { href: '/student/tips', label: 'Başarı Rehberi', icon: <TrendingUp className="h-5 w-5" /> },
  ];

  // Determine which set of links to show based on user role AND path
  let navLinks: NavLink[] = [];
  
  if (isAdmin && pathname?.startsWith('/admin')) {
    navLinks = adminLinks;
  } else if (isTutor && pathname?.startsWith('/tutor')) {
    navLinks = tutorLinks;
  } else if (isStudent && pathname?.startsWith('/student')) {
    navLinks = studentLinks;
  } else if (isAdmin) {
    navLinks = adminLinks;
  } else if (isTutor) {
    navLinks = tutorLinks;
  } else if (isStudent) {
    navLinks = studentLinks;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  // Determine sidebar title based on current path
  let sidebarTitle = "";
  let activeLinkColor = "";
  let activeIconBg = "";
  
  if (pathname?.startsWith('/admin')) {
    sidebarTitle = "Yönetici Paneli";
    activeLinkColor = "text-indigo-600";
    activeIconBg = "bg-indigo-100";
  } else if (pathname?.startsWith('/tutor')) {
    sidebarTitle = "Öğretmen Paneli";
    activeLinkColor = "text-blue-600";
    activeIconBg = "bg-blue-100";
  } else if (pathname?.startsWith('/student')) {
    sidebarTitle = "Öğrenci Paneli";
    activeLinkColor = "text-teal-600";
    activeIconBg = "bg-teal-100";
  } else {
    sidebarTitle = isAdmin ? "Yönetici Paneli" : isTutor ? "Öğretmen Paneli" : "Öğrenci Paneli";
    activeLinkColor = isAdmin ? "text-indigo-600" : isTutor ? "text-blue-600" : "text-teal-600";
    activeIconBg = isAdmin ? "bg-indigo-100" : isTutor ? "bg-blue-100" : "bg-teal-100";
  }

  const NavigationLinks = () => (
    <ul className="space-y-2">
      {navLinks.map((link) => (
        <li key={link.href}>
          <Link 
            href={link.href} 
            className={`flex items-center justify-start px-4 py-2 rounded-lg transition-all duration-200 ${
              isActive(link.href) 
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
      ))}
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
              {user?.role === UserRole.ADMIN ? 'Yönetici' : user?.role === UserRole.TUTOR ? 'Öğretmen' : user?.role === UserRole.ASISTAN ? 'Asistan' : 'Öğrenci'}
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
                <NavigationLinks />
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
                      {user?.role === UserRole.ADMIN ? 'Yönetici' : user?.role === UserRole.TUTOR ? 'Öğretmen' : user?.role === UserRole.ASISTAN ? 'Asistan' : 'Öğrenci'}
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