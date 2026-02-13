'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, UserPlus, Calendar as CalendarIcon, MoreVertical, Filter, Plus, X, User } from 'lucide-react';
import { getAthletes, upsertAthleteProfile, searchStudents, getSportBranches, registerNewAthlete } from '@/app/actions/athlete-actions';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AthleteList() {
    const [athletes, setAthletes] = useState<any[]>([]);
    const [branches, setBranches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
    const [healthExpiry, setHealthExpiry] = useState<string>('');
    const [registerTab, setRegisterTab] = useState('existing');

    // New athlete form state
    const [newAthlete, setNewAthlete] = useState({
        username: '',
        firstName: '',
        lastName: '',
    });

    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    // Real-time search with debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (studentSearch.length >= 2) {
                handleSearchStudents();
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [studentSearch]);

    const fetchData = async () => {
        setLoading(true);
        const [athletesRes, branchesRes] = await Promise.all([
            getAthletes(),
            getSportBranches()
        ]);
        if (athletesRes.data) setAthletes(athletesRes.data);
        if (branchesRes.data) setBranches(branchesRes.data);
        setLoading(false);
    };

    const handleSearchStudents = async () => {
        const result = await searchStudents(studentSearch);
        if (result.data) setSearchResults(result.data);
    };

    const handleSaveAthlete = async () => {
        if (registerTab === 'existing') {
            if (!selectedStudent || selectedBranches.length === 0) {
                toast({ title: 'Hata', description: 'Öğrenci ve en az bir branş seçmelisiniz', variant: 'destructive' });
                return;
            }

            const result = await upsertAthleteProfile({
                userId: selectedStudent.id,
                branchIds: selectedBranches,
                healthReportExpiry: healthExpiry ? new Date(healthExpiry) : undefined
            });

            if (!result.error) {
                toast({ title: 'Başarılı', description: 'Sporcu başarıyla kaydedildi' });
                closeModal();
                fetchData();
            } else {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            }
        } else {
            // New Registration
            if (!newAthlete.username || !newAthlete.firstName || !newAthlete.lastName || selectedBranches.length === 0) {
                toast({ title: 'Hata', description: 'Tüm alanları doldurmalı ve en az bir branş seçmelisiniz', variant: 'destructive' });
                return;
            }

            const result = await registerNewAthlete({
                ...newAthlete,
                branchIds: selectedBranches,
                healthReportExpiry: healthExpiry ? new Date(healthExpiry) : undefined
            });

            if (!result.error) {
                toast({ title: 'Başarılı', description: 'Yeni sporcu kaydı oluşturuldu' });
                closeModal();
                fetchData();
            } else {
                toast({ title: 'Hata', description: result.error, variant: 'destructive' });
            }
        }
    };

    const closeModal = () => {
        setIsAdding(false);
        resetAddForm();
    };

    const resetAddForm = () => {
        setSelectedStudent(null);
        setSelectedBranches([]);
        setHealthExpiry('');
        setStudentSearch('');
        setSearchResults([]);
        setNewAthlete({ username: '', firstName: '', lastName: '' });
        setRegisterTab('existing');
    };

    const filteredAthletes = athletes.filter(a =>
        `${a.user.firstName} ${a.user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.user.username.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Sporcu ara..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
                    <UserPlus className="h-4 w-4 mr-2" /> Sporcu Ekle
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => <Card key={i} className="animate-pulse h-24 bg-gray-50 border-0" />)
                ) : filteredAthletes.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl">
                        <Filter className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">Sporcu bulunamadı</p>
                    </div>
                ) : (
                    filteredAthletes.map((athlete) => (
                        <Card key={athlete.id} className="hover:shadow-md transition-shadow group">
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-indigo-100">
                                        <AvatarImage src={athlete.user.avatarUrl} />
                                        <AvatarFallback className="bg-indigo-50 text-indigo-700">
                                            {athlete.user.firstName?.[0]}{athlete.user.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-bold text-gray-800 truncate">
                                            {athlete.user.firstName} {athlete.user.lastName}
                                        </h4>
                                        <p className="text-xs text-gray-500 truncate">@{athlete.user.username}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {athlete.branches.map((b: any) => (
                                                <Badge key={b.id} variant="secondary" className="text-[10px] px-1.5 py-0 bg-gray-100">
                                                    {b.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center text-xs">
                                    <div className="flex items-center text-gray-500">
                                        <CalendarIcon className="h-3 w-3 mr-1" />
                                        Sağlık Raporu:
                                    </div>
                                    <span className={cn(
                                        "font-medium",
                                        athlete.healthReportExpiry && new Date(athlete.healthReportExpiry) < new Date()
                                            ? "text-red-500"
                                            : "text-green-600"
                                    )}>
                                        {athlete.healthReportExpiry
                                            ? format(new Date(athlete.healthReportExpiry), 'dd.MM.yyyy')
                                            : 'Belirtilmedi'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            <Dialog open={isAdding} onOpenChange={(open) => { setIsAdding(open); if (!open) resetAddForm(); }}>
                <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Sporcu Kaydı</DialogTitle>
                        <DialogDescription>
                            Sistemdeki bir öğrenciyi seçin veya tamamen yeni bir sporcu kaydı oluşturun.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={registerTab} onValueChange={setRegisterTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="existing">Sistemden Seç</TabsTrigger>
                            <TabsTrigger value="new">Yeni Kayıt</TabsTrigger>
                        </TabsList>

                        <TabsContent value="existing" className="space-y-4">
                            {!selectedStudent ? (
                                <div className="space-y-2">
                                    <Label>Öğrenci Ara</Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="İsim veya kullanıcı adı..."
                                            className="pl-10"
                                            value={studentSearch}
                                            onChange={(e) => setStudentSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="mt-2 max-h-48 overflow-y-auto border rounded-xl divide-y">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(s => (
                                                <div
                                                    key={s.id}
                                                    className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between transition-colors"
                                                    onClick={() => setSelectedStudent(s)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={s.avatarUrl} />
                                                            <AvatarFallback className="bg-gray-100 text-[10px]">{s.firstName?.[0]}{s.lastName?.[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-semibold">{s.firstName} {s.lastName}</p>
                                                            <p className="text-xs text-gray-500">@{s.username}</p>
                                                        </div>
                                                    </div>
                                                    <Plus className="h-4 w-4 text-indigo-500" />
                                                </div>
                                            ))
                                        ) : studentSearch.length >= 2 ? (
                                            <p className="p-4 text-center text-sm text-gray-500 italic">Sonuç bulunamadı</p>
                                        ) : (
                                            <p className="p-4 text-center text-sm text-gray-500">Aramak için yazmaya başlayın...</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-indigo-50 rounded-2xl flex justify-between items-center border border-indigo-100 animate-in fade-in zoom-in duration-200">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={selectedStudent.avatarUrl} />
                                            <AvatarFallback className="bg-indigo-200 text-indigo-700 font-bold">
                                                {selectedStudent.firstName?.[0]}{selectedStudent.lastName?.[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <span className="font-bold text-indigo-900 block">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                                            <span className="text-xs text-indigo-600">@{selectedStudent.username}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(null)} className="h-8 w-8 p-0 hover:bg-indigo-100 text-indigo-600 rounded-full">
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="new" className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Adı</Label>
                                    <Input
                                        placeholder="Örn: Ahmet"
                                        value={newAthlete.firstName}
                                        onChange={(e) => setNewAthlete({ ...newAthlete, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Soyadı</Label>
                                    <Input
                                        placeholder="Örn: Yılmaz"
                                        value={newAthlete.lastName}
                                        onChange={(e) => setNewAthlete({ ...newAthlete, lastName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Kullanıcı Adı</Label>
                                <Input
                                    placeholder="Sisteme giriş için benzersiz bir ad"
                                    value={newAthlete.username}
                                    onChange={(e) => setNewAthlete({ ...newAthlete, username: e.target.value })}
                                />
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-3">
                                <User className="h-5 w-5 text-indigo-600 shrink-0" />
                                <p className="text-xs text-indigo-800 leading-relaxed">
                                    Bu işlem sisteme sadece bir sporcu profili olarak yeni bir kullanıcı ekler. Bu kullanıcı sadece Sporcu Paneli (Part 9) erişimine sahip olacaktır. Başlangıç şifresi kullanıcının kullanıcı adı olacaktır.
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-4 mt-4 border-t pt-4">
                        <div className="space-y-2">
                            <Label>Branşlar</Label>
                            <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl bg-gray-50/50">
                                {branches.map(branch => (
                                    <div key={branch.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded-md transition-colors">
                                        <Checkbox
                                            id={`branch-${branch.id}`}
                                            checked={selectedBranches.includes(branch.id)}
                                            onCheckedChange={(checked) => {
                                                setSelectedBranches(checked
                                                    ? [...selectedBranches, branch.id]
                                                    : selectedBranches.filter(id => id !== branch.id)
                                                );
                                            }}
                                        />
                                        <label htmlFor={`branch-${branch.id}`} className="text-sm font-medium leading-none cursor-pointer flex-1 py-1">
                                            {branch.name}
                                        </label>
                                    </div>
                                ))}
                                {branches.length === 0 && <p className="text-xs text-gray-400 italic">Önce branş eklemelisiniz</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="health-date">Sağlık Raporu Geçerlilik Süresi</Label>
                            <Input
                                id="health-date"
                                type="date"
                                value={healthExpiry}
                                onChange={(e) => setHealthExpiry(e.target.value)}
                                className="w-full rounded-xl"
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-6">
                        <Button variant="outline" onClick={closeModal} className="rounded-xl">İptal</Button>
                        <Button
                            onClick={handleSaveAthlete}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 rounded-xl px-8"
                            disabled={registerTab === 'existing' ? (!selectedStudent || selectedBranches.length === 0) : (!newAthlete.username || !newAthlete.firstName || !newAthlete.lastName || selectedBranches.length === 0)}
                        >
                            Sporcuyu Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
