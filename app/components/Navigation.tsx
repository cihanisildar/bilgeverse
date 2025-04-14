'use client';

// NOTE: This component is currently not being used.
// The sidebar navigation in (authenticated)/layout.tsx is being used instead.
// This file is kept for reference purposes but could be removed.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserRole } from '@prisma/client';

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout, isAdmin, isTutor, isStudent } = useAuth();
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const isActive = (path: string) => pathname === path || (path !== '/' && pathname?.startsWith(path));

  const adminLinks = [
    { href: '/admin', label: 'Gösterge Paneli' },
    { href: '/admin/users', label: 'Kullanıcı Yönetimi' },
    { href: '/admin/registration-requests', label: 'Kayıt İstekleri' },
    { href: '/admin/events', label: 'Etkinlikler' },
    { href: '/admin/store', label: 'Mağaza Yönetimi' },
  ];

  const tutorLinks = [
    { href: '/tutor', label: 'Gösterge Paneli' },
    { href: '/tutor/students', label: 'Öğrencilerim' },
    { href: '/tutor/events', label: 'Etkinlikler' },
    { href: '/tutor/points', label: 'Puan Ver' },
    { href: '/tutor/requests', label: 'Ürün İstekleri' },
  ];

  const studentLinks = [
    { href: '/student', label: 'Gösterge Paneli' },
    { href: '/student/events', label: 'Etkinlikler' },
    { href: '/student/leaderboard', label: 'Liderlik Tablosu' },
    { href: '/student/store', label: 'Mağaza' },
    { href: '/student/requests', label: 'İsteklerim' },
  ];

  const links = isAdmin 
    ? adminLinks 
    : isTutor 
      ? tutorLinks 
      : isStudent 
        ? studentLinks 
        : [];

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center py-3 px-4 md:px-6">
          <div className="text-gray-800 font-bold text-lg">
            {isAdmin ? "Yönetici Paneli" : "Öğretmen Takip"}
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium ${
                  isActive(link.href)
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
          
          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="grid gap-4 py-4">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`px-3 py-2 text-sm font-medium ${
                        isActive(link.href)
                          ? 'text-primary'
                          : 'text-gray-500 hover:text-gray-900'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarFallback>
                  {user?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <div className="text-gray-800 text-sm font-medium">
                  {user?.username}
                </div>
                <div className="text-gray-500 text-xs">
                  {user?.role === UserRole.ADMIN ? 'Yönetici' : user?.role === UserRole.TUTOR ? 'Öğretmen' : 'Öğrenci'}
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              onClick={logout} 
              size="sm" 
              className="text-gray-500 hover:text-gray-700">
              Çıkış Yap
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
} 