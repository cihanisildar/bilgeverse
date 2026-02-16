"use client";

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { UserPlus, Trash2, Loader2, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserRole } from '@prisma/client';
import { AcademyAssignment, AcademyStudent } from '@/types/academy';
import { useUsers, useAssignStaff, useRemoveStaff, useEnrollStudent, useUnenrollStudent } from '@/app/hooks/use-academy-data';

export function AcademyAssignments({ lessonId, assignments }: { lessonId: string, assignments: AcademyAssignment[] }) {
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const assignMutation = useAssignStaff();
    const removeMutation = useRemoveStaff();
    const [search, setSearch] = useState('');

    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase();
            const searchTerm = search.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) || u.username.toLowerCase().includes(searchTerm);

            const roles = u.roles || (u.role ? [u.role as UserRole] : []);
            const isStaff = roles.some(r => ([UserRole.ADMIN, UserRole.TUTOR, UserRole.ASISTAN] as UserRole[]).includes(r));
            const notAlreadyAssigned = !assignments.some(a => a.userId === u.id);

            return matchesSearch && isStaff && notAlreadyAssigned;
        });
    }, [users, search, assignments]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Görevli Yönetimi</h2>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-md transition-all hover:scale-105">
                            <UserPlus className="h-4 w-4 mr-2" />
                            Görevli Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Görevli Ata</DialogTitle>
                            <DialogDescription>
                                Ders için eğitmen veya asistan seçin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2 relative">
                                <Label>Görevli Ara</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="İsim veya kullanıcı adı..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                {usersLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>
                                ) : filteredUsers.length === 0 ? (
                                    <p className="text-center text-gray-500 py-4 italic text-sm">Görevi atanabilecek kullanıcı bulunamadı.</p>
                                ) : (
                                    filteredUsers.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-blue-50/50 transition-colors">
                                            <div>
                                                <p className="font-medium text-slate-800">{user.firstName} {user.lastName}</p>
                                                <p className="text-xs text-indigo-500">@{user.username}</p>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button
                                                    size="sm"
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    disabled={assignMutation.isPending}
                                                    onClick={() => assignMutation.mutate({ lessonId, userId: user.id, role: UserRole.TUTOR })}
                                                >
                                                    {assignMutation.isPending && assignMutation.variables?.userId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
                                                </Button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 border-none">
                            <TableHead className="font-bold py-4 pl-6 text-slate-700">Ad Soyad</TableHead>
                            <TableHead className="font-bold py-4 text-slate-700">Rol</TableHead>
                            <TableHead className="text-right font-bold py-4 pr-6 text-slate-700">İşlemler</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {assignments.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-12 text-gray-500 italic">
                                    Kaynak atanmış görevli bulunmuyor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            assignments.map((a) => (
                                <TableRow key={a.id} className="hover:bg-slate-50/50 transition-colors border-gray-50">
                                    <TableCell className="font-medium pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 font-bold">{a.user?.firstName} {a.user?.lastName}</span>
                                            <span className="text-xs text-blue-500 font-medium italic">@{a.user?.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 font-semibold px-2.5">
                                                {a.role === 'TUTOR' ? 'Eğitmen' : a.role === 'ASISTAN' ? 'Asistan' : a.role}
                                            </Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 px-3 text-[10px] text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg font-bold uppercase tracking-wider transition-colors"
                                                onClick={() => assignMutation.mutate({
                                                    lessonId,
                                                    userId: a.userId,
                                                    role: a.role === UserRole.TUTOR ? UserRole.ASISTAN : UserRole.TUTOR
                                                })}
                                                disabled={assignMutation.isPending}
                                            >
                                                {a.role === UserRole.TUTOR ? 'Asistan Yap' : 'Eğitmen Yap'}
                                            </Button>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6 py-4">
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    disabled={removeMutation.isPending}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-9 w-9 p-0 shadow-sm"
                                                >
                                                    {removeMutation.isPending && removeMutation.variables?.userId === a.userId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Görevliyi Kaldır?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        "{a.user?.firstName} {a.user?.lastName}" isimli görevliyi bu dersten çıkarmak üzeresiniz.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => removeMutation.mutate({ lessonId, userId: a.userId })}
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        Kaldır
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

export function AcademyStudents({ lessonId, students, canManage }: { lessonId: string, students: AcademyStudent[], canManage: boolean }) {
    const { data: users = [], isLoading: usersLoading } = useUsers();
    const enrollMutation = useEnrollStudent();
    const unenrollMutation = useUnenrollStudent();
    const [search, setSearch] = useState('');

    const filteredStudents = useMemo(() => {
        return users.filter(s => {
            const fullName = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
            const searchTerm = search.toLowerCase();
            const matchesSearch = fullName.includes(searchTerm) || s.username.toLowerCase().includes(searchTerm);

            const roles = s.roles || (s.role ? [s.role as UserRole] : []);
            const isStudent = roles.includes(UserRole.STUDENT);
            const notAlreadyEnrolled = !students.some(st => st.studentId === s.id);

            return matchesSearch && isStudent && notAlreadyEnrolled;
        });
    }, [users, search, students]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Öğrenci Listesi ({students.length})</h2>
                {canManage && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all hover:scale-105">
                                <UserPlus className="h-4 w-4 mr-2" />
                                Öğrenci Ekle
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Yeni Öğrenci Kaydet</DialogTitle>
                                <DialogDescription>
                                    Derse kaydetmek istediğiniz öğrenciyi seçin.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="İsim veya kullanıcı adı..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                                    {usersLoading ? (
                                        <div className="flex justify-center py-8"><Loader2 className="animate-spin text-blue-600" /></div>
                                    ) : filteredStudents.length === 0 ? (
                                        <p className="text-center text-gray-500 py-4 italic text-sm">Kaydedilebilecek öğrenci bulunamadı.</p>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <div key={student.id} className="flex items-center justify-between p-3 border rounded-xl hover:bg-indigo-50/50 transition-colors">
                                                <div>
                                                    <p className="font-medium text-slate-800">{student.firstName} {student.lastName}</p>
                                                    <p className="text-xs text-indigo-500">@{student.username}</p>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm border-0"
                                                    disabled={enrollMutation.isPending}
                                                    onClick={() => enrollMutation.mutate({ lessonId, studentId: student.id })}
                                                >
                                                    {enrollMutation.isPending && enrollMutation.variables?.studentId === student.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Kaydet'}
                                                </Button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-slate-50/50 border-none">
                            <TableHead className="font-bold py-4 pl-6 text-slate-700">Ad Soyad</TableHead>
                            <TableHead className="font-bold py-4 text-slate-700">Kayıt Tarihi</TableHead>
                            {canManage && <TableHead className="text-right font-bold py-4 pr-6 text-slate-700">İşlemler</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {students.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={canManage ? 3 : 2} className="text-center py-12 text-gray-500 italic">
                                    Bu derse kayıtlı öğrenci bulunmuyor.
                                </TableCell>
                            </TableRow>
                        ) : (
                            students.map((s) => (
                                <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors border-gray-50">
                                    <TableCell className="font-medium pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-900 font-bold">{s.student?.firstName} {s.student?.lastName}</span>
                                            <span className="text-xs text-indigo-500 font-medium italic">@{s.student?.username}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-slate-600 font-medium py-4">{new Date(s.joinedAt).toLocaleDateString('tr-TR')}</TableCell>
                                    {canManage && (
                                        <TableCell className="text-right pr-6 py-4">
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        disabled={unenrollMutation.isPending}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full h-9 w-9 p-0 shadow-sm"
                                                    >
                                                        {unenrollMutation.isPending && unenrollMutation.variables?.studentId === s.studentId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Öğrenci Kaydını Sil?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            "{s.student?.firstName} {s.student?.lastName}" isimli öğrencinin bu dersle ilişiğini kesmek istediğinize emin misiniz?
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            onClick={() => unenrollMutation.mutate({ lessonId, studentId: s.studentId })}
                                                            className="bg-red-600 hover:bg-red-700 text-white"
                                                        >
                                                            Kaydı Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
