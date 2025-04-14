'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import Link from 'next/link';
import { Button } from "../../components/ui/button";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { LogOut, LayoutDashboard, Users, FileText, Calendar, ShoppingBag, PieChart, GraduationCap, Trophy, ShoppingCart, ClipboardList, School } from "lucide-react";
import { UserRole } from '@prisma/client';

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
  const { user, loading, isAdmin, isTutor, isStudent } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

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
    { href: '/admin/users', label: 'Kullanıcı Yönetimi', icon: <Users className="h-5 w-5" /> },
    { href: '/admin/registration-requests', label: 'Kayıt İstekleri', icon: <FileText className="h-5 w-5" /> },
    { href: '/admin/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/admin/store', label: 'Mağaza Yönetimi', icon: <ShoppingBag className="h-5 w-5" /> },
    { href: '/admin/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
  ];

  const tutorLinks: NavLink[] = [
    { href: '/tutor', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/tutor/students', label: 'Öğrencilerim', icon: <GraduationCap className="h-5 w-5" /> },
    { href: '/tutor/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/tutor/points', label: 'Puan Ver', icon: <PieChart className="h-5 w-5" /> },
    { href: '/tutor/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/tutor/store', label: 'Mağaza', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/tutor/requests', label: 'Ürün İstekleri', icon: <ClipboardList className="h-5 w-5" /> },
  ];

  const studentLinks: NavLink[] = [
    { href: '/student', label: 'Gösterge Paneli', icon: <LayoutDashboard className="h-5 w-5" /> },
    { href: '/student/classroom', label: 'Sınıfım', icon: <School className="h-5 w-5" /> },
    { href: '/student/events', label: 'Etkinlikler', icon: <Calendar className="h-5 w-5" /> },
    { href: '/student/leaderboard', label: 'Liderlik Tablosu', icon: <Trophy className="h-5 w-5" /> },
    { href: '/student/store', label: 'Mağaza', icon: <ShoppingCart className="h-5 w-5" /> },
    { href: '/student/requests', label: 'İsteklerim', icon: <ClipboardList className="h-5 w-5" /> },
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

  return (
    <div className="flex min-h-screen font-sans">
      {/* Sidebar - Narrow Fixed with Hover Expand */}
      <div 
        className={`fixed top-0 left-0 bottom-0 ${isExpanded ? 'w-[240px]' : 'w-[60px]'} h-full bg-white border-r border-gray-100 shadow-sm z-10 transition-all duration-300 ease-in-out`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        {/* Purple top border */}
        <div className="h-1 w-full bg-indigo-600"></div>
        
        <div className="flex flex-col h-full">
          {/* Title area */}
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
          
          {/* Navigation Links */}
          <div className="flex-1 py-4">
            <ul className="space-y-2">
              {navLinks.map((link) => (
                <li key={link.href} className={isExpanded ? 'px-3' : 'px-3'}>
                  <Link 
                    href={link.href} 
                    className={`flex items-center ${isExpanded ? 'justify-start px-4' : 'justify-center'} py-2 rounded-lg transition-all duration-200 ${isActive(link.href) ? `${activeIconBg} ${activeLinkColor} font-medium` : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
                    title={isExpanded ? '' : link.label}
                  >
                    <div className={`flex-shrink-0 ${isExpanded ? 'mr-3' : ''}`}>
                      {link.icon}
                    </div>
                    {isExpanded && (
                      <span className="truncate text-sm tracking-wide">{link.label}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          {/* User Avatar */}
          <div className="p-3 border-t border-gray-100">
            <div className={`flex ${isExpanded ? 'items-center px-3' : 'justify-center'}`}>
              <Avatar className="h-10 w-10 bg-indigo-100 text-indigo-600 flex-shrink-0" title={user?.username}>
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isExpanded && (
                <div className="ml-3 overflow-hidden">
                  <p className="text-sm font-medium text-gray-800 truncate tracking-wide">{user?.username}</p>
                  <p className="text-xs text-gray-500 tracking-wide">{user?.role === UserRole.ADMIN ? 'Yönetici' : user?.role === UserRole.TUTOR ? 'Öğretmen' : 'Öğrenci'}</p>
                </div>
              )}
              
              {isExpanded && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="ml-auto text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                  title="Çıkış Yap"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={`${isExpanded ? 'ml-[240px]' : 'ml-[60px]'} flex-1 transition-all duration-300 ease-in-out`}>
        <main>
          {children}
        </main>
      </div>
    </div>
  );
} 