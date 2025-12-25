'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Search, GraduationCap, ChevronLeft, ChevronRight, Briefcase, UserCog, Edit } from 'lucide-react';
import { registerStudentsToMeslekkocu } from '@/app/actions/meslekkocu';
import { useToast } from '@/app/hooks/use-toast';
import { cn } from '@/lib/utils';

// Add type for the student data structure used in the form
interface StudentFormData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
}

interface Student {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    meslekkocuId: string | null;
}

interface StudentIntegrationListProps {
    students: Student[];
}

const ITEMS_PER_PAGE = 10;

import { useRouter } from 'next/navigation';

export default function StudentIntegrationList({ students }: StudentIntegrationListProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<StudentFormData | null>(null);
    const [selectedProducts, setSelectedProducts] = useState<string[]>(['M', 'S']);

    const toast = useToast();

    const [filterStatus, setFilterStatus] = useState<'all' | 'integrated' | 'not_integrated'>('all');

    // Filter students based on search and status
    const filteredStudents = useMemo(() => {
        let result = students;

        // Status Filter
        if (filterStatus === 'integrated') {
            result = result.filter(s => s.meslekkocuId);
        } else if (filterStatus === 'not_integrated') {
            result = result.filter(s => !s.meslekkocuId);
        }

        if (!searchQuery) return result;

        const lowerQuery = searchQuery.toLowerCase();
        return result.filter((s) =>
            (s.firstName?.toLowerCase() || '').includes(lowerQuery) ||
            (s.lastName?.toLowerCase() || '').includes(lowerQuery) ||
            s.email.toLowerCase().includes(lowerQuery)
        );
    }, [students, searchQuery, filterStatus]);

    // Pagination logic
    const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredStudents.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredStudents, currentPage]);

    // Reset page when search or filter changes
    useMemo(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const handleOpenDialog = (student: Student) => {
        setEditingStudent({
            id: student.id,
            firstName: student.firstName || '',
            lastName: student.lastName || '',
            email: student.email || '',
            phone: student.phone || '', // Admin needs to fill this if empty
        });
        setSelectedProducts(['M', 'S']); // Default selection
        setIsDialogOpen(true);
    };

    const handleProductToggle = (code: string) => {
        setSelectedProducts(prev => {
            if (prev.includes(code)) {
                return prev.filter(c => c !== code);
            } else {
                return [...prev, code];
            }
        });
    };

    const handleInputChange = (field: keyof StudentFormData, value: string) => {
        if (editingStudent) {
            setEditingStudent({ ...editingStudent, [field]: value });
        }
    };

    const handleRegister = async () => {
        if (!editingStudent) return;

        // Basic validation
        if (!editingStudent.firstName || !editingStudent.lastName || !editingStudent.email || !editingStudent.phone) {
            toast.error('Lütfen ad, soyad, e-posta ve telefon alanlarını doldurun.');
            return;
        }

        // Phone validation & formatting
        let cleanPhone = editingStudent.phone.replace(/\D/g, ''); // Remove non-digits
        if (cleanPhone.startsWith('90')) cleanPhone = cleanPhone.substring(2);
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.substring(1);

        if (cleanPhone.length !== 10 || !cleanPhone.startsWith('5')) {
            toast.error('Telefon numarası 5 ile başlamalı ve 10 haneli olmalıdır (Örn: 5551234567).');
            return;
        }

        if (selectedProducts.length === 0) {
            toast.error('Lütfen en az bir hizmet (Meslek/Sınav Koçu) seçin.');
            return;
        }

        setLoading(true);
        try {
            const studentToRegister = {
                ...editingStudent,
                phone: cleanPhone, // Send formatted phone
                productCode: selectedProducts,
            };

            // Although action takes an array, we send one
            const results = await registerStudentsToMeslekkocu([studentToRegister]);

            if (results[0].success) {
                toast.success(`"${editingStudent.firstName} ${editingStudent.lastName}" başarıyla kaydedildi.`);
                setIsDialogOpen(false);
                router.refresh();
            } else {
                toast.error(results[0].message);
            }

        } catch (error) {
            console.error(error);
            toast.error('Beklenmedik bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card className="border-0 shadow-lg rounded-2xl overflow-hidden mt-6 flex flex-col min-h-[600px]">
                <CardHeader className="bg-white border-b space-y-4 pb-6 pt-6">
                    <div className="space-y-1">
                        <CardTitle className="text-xl text-gray-800">Öğrenci Kayıt ve Entegrasyon</CardTitle>
                        <CardDescription>
                            Meslekkocu sistemine aktarmak istediğiniz öğrenciyi listeden seçerek eksik bilgileri tamamlayın.
                        </CardDescription>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2">
                        <div className="relative w-full sm:max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                placeholder="Öğrenci ara (İsim, E-posta...)"
                                className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-indigo-500"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                className="h-10 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as any)}
                            >
                                <option value="all">Tümü</option>
                                <option value="integrated">Entegre Edilenler</option>
                                <option value="not_integrated">Entegre Edilmeyenler</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 flex flex-col">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                    <TableHead>Ad Soyad</TableHead>
                                    <TableHead>E-posta</TableHead>
                                    <TableHead>Telefon</TableHead>
                                    <TableHead className="text-right">İşlem</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedStudents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-12 text-gray-500">
                                            {searchQuery ? 'Aramanızla eşleşen öğrenci bulunamadı.' : 'Listelenecek öğrenci yok.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedStudents.map((student) => (
                                        <TableRow
                                            key={student.id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <TableCell className="font-medium text-gray-700">
                                                {student.firstName} {student.lastName}
                                            </TableCell>
                                            <TableCell className="text-gray-600">{student.email}</TableCell>
                                            <TableCell className="text-gray-600">{student.phone || <span className="text-orange-500 text-xs">(Eksik)</span>}</TableCell>
                                            <TableCell className="text-right">
                                                {student.meslekkocuId ? (
                                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                                                        <span className="flex items-center gap-1">
                                                            <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                                            Entegre Edildi
                                                        </span>
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                                                        onClick={() => handleOpenDialog(student)}
                                                    >
                                                        <UserCog className="h-4 w-4 mr-2" />
                                                        Entegrasyonu Başlat
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="border-t p-4 flex items-center justify-between bg-gray-50/30 mt-auto">
                            <div className="text-sm text-gray-500">
                                Toplam <span className="font-medium text-gray-900">{filteredStudents.length}</span> öğrenciden <span className="font-medium text-gray-900">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span className="font-medium text-gray-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredStudents.length)}</span> arası gösteriliyor
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <div className="text-sm font-medium px-2">
                                    Sayfa {currentPage} / {totalPages}
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="h-8 w-8 p-0"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Öğrenci Entegrasyon Detayları</DialogTitle>
                        <DialogDescription>
                            Kayıt için gerekli bilgileri kontrol edin ve eksikleri tamamlayın.
                        </DialogDescription>
                    </DialogHeader>

                    {editingStudent && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">Ad <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="firstName"
                                        value={editingStudent.firstName}
                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Soyad <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="lastName"
                                        value={editingStudent.lastName}
                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">E-posta <span className="text-red-500">*</span></Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={editingStudent.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefon <span className="text-red-500">*</span></Label>
                                <Input
                                    id="phone"
                                    placeholder="5551234567"
                                    value={editingStudent.phone}
                                    onChange={(e) => {
                                        // Only allow digits and max 11 chars
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 11);
                                        handleInputChange('phone', val);
                                    }}
                                />
                                <p className="text-xs text-muted-foreground">API zorunlu alanı. 10 hane, 0 olmadan (Örn: 555xxxxxxx).</p>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label>Hizmet Seçimi <span className="text-red-500">*</span></Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => handleProductToggle('M')}>
                                        <div className="flex items-center space-x-2">
                                            <Briefcase className="h-4 w-4 text-indigo-600" />
                                            <span className="text-sm font-medium">Meslek Koçu</span>
                                        </div>
                                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedProducts.includes('M') ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                                            {selectedProducts.includes('M') && <ChevronRight className="h-3 w-3 text-white transform rotate-45" />}
                                            {/* Just a checkmark simulation */}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer" onClick={() => handleProductToggle('S')}>
                                        <div className="flex items-center space-x-2">
                                            <GraduationCap className="h-4 w-4 text-pink-600" />
                                            <span className="text-sm font-medium">Sınav Koçu</span>
                                        </div>
                                        <div className={`h-4 w-4 rounded border flex items-center justify-center ${selectedProducts.includes('S') ? 'bg-pink-600 border-pink-600' : 'border-gray-300'}`}>
                                            {selectedProducts.includes('S') && <ChevronRight className="h-3 w-3 text-white transform rotate-45" />}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={loading}>
                            Vazgeç
                        </Button>
                        <Button
                            onClick={handleRegister}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Gönderiliyor...
                                </>
                            ) : (
                                'Kaydı Tamamla'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
