import { LayoutDashboard, Grid3x3 } from 'lucide-react';
import { ReactNode } from 'react';

export interface Part {
  id: number;
  name: string;
  description: string;
  path: string;
  icon: ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
}

export const PARTS: Part[] = [
  {
    id: 1,
    name: 'Yönetim Kurulu',
    description: 'Yönetim kurulu toplantılarını yönetin ve katılım takibi yapın',
    path: '/dashboard/part1',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-indigo-500 to-purple-500',
    bgColor: 'bg-indigo-50',
    textColor: 'text-indigo-600',
  },
  {
    id: 2,
    name: 'Part 2',
    description: 'Coming soon...',
    path: '/dashboard/part2',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-600',
  },
  {
    id: 3,
    name: 'Part 3',
    description: 'Coming soon...',
    path: '/dashboard/part3',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-600',
  },
  {
    id: 4,
    name: 'Part 4',
    description: 'Coming soon...',
    path: '/dashboard/part4',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-600',
  },
  {
    id: 5,
    name: 'Part 5',
    description: 'Coming soon...',
    path: '/dashboard/part5',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-red-500 to-pink-500',
    bgColor: 'bg-red-50',
    textColor: 'text-red-600',
  },
  {
    id: 6,
    name: 'Part 6',
    description: 'Coming soon...',
    path: '/dashboard/part6',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-teal-500 to-cyan-500',
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-600',
  },
  {
    id: 7,
    name: 'Bilgeverse',
    description: 'Öğrenci Takip ve Puan Yönetim Sistemi',
    path: '/dashboard/part7',
    icon: <LayoutDashboard className="h-8 w-8" />,
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-600',
  },
  {
    id: 8,
    name: 'Part 8',
    description: 'Coming soon...',
    path: '/dashboard/part8',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-rose-500 to-pink-500',
    bgColor: 'bg-rose-50',
    textColor: 'text-rose-600',
  },
  {
    id: 9,
    name: 'Part 9',
    description: 'Coming soon...',
    path: '/dashboard/part9',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-slate-500 to-gray-500',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-600',
  },
  {
    id: 10,
    name: 'Belgeler',
    description: 'Tüm bölümler için PDF belgelerini görüntüleyin ve yönetin',
    path: '/dashboard/part10',
    icon: <Grid3x3 className="h-8 w-8" />,
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    textColor: 'text-emerald-600',
  },
];

