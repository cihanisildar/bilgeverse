'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  Copy,
  Filter,
  Link2,
  Mail,
  RefreshCw,
  Search,
  User,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// Student type definition
type Student = {
  id: string;
  name: string;
  studentId: string;
  email: string;
  class?: string;
  grade?: string;
  isSelected?: boolean;
};

// Event type definition
type Event = {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  capacity: number;
  enrolledStudents: number;
};

export default function InviteStudents() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [sendEmailDialog, setSendEmailDialog] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  
  useEffect(() => {
    const fetchEventAndStudents = async () => {
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await fetch(`/api/events/${eventId}`, {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!eventResponse.ok) {
          throw new Error('Failed to fetch event details');
        }

        const eventData = await eventResponse.json();
        const formattedEvent = {
          id: eventData.event._id || eventData.event.id,
          title: eventData.event.title,
          startDate: eventData.event.startDateTime || eventData.event.startDate,
          endDate: eventData.event.endDateTime || eventData.event.endDate,
          capacity: eventData.event.capacity,
          enrolledStudents: eventData.event.enrolledStudents || 0
        };
        
        setEvent(formattedEvent);
        
        // Fetch available students
        const studentsResponse = await fetch('/api/students/available', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });

        if (!studentsResponse.ok) {
          throw new Error('Failed to fetch available students');
        }

        const studentsData = await studentsResponse.json();
        const formattedStudents = studentsData.students.map((student: any) => ({
          id: student._id || student.id,
          name: `${student.firstName} ${student.lastName}`,
          studentId: student.studentId,
          email: student.email,
          class: student.class,
          grade: student.grade,
          isSelected: false
        }));
        
        setStudents(formattedStudents);
        setFilteredStudents(formattedStudents);
        
        // Set default email template
        if (formattedEvent) {
          setEmailSubject(`Davet: ${formattedEvent.title}`);
          
          const eventDate = new Date(formattedEvent.startDate);
          const formattedDate = new Intl.DateTimeFormat('tr-TR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(eventDate);
          
          setEmailBody(
`Merhaba,

"${formattedEvent.title}" etkinliğine davetlisiniz!

Tarih ve Saat: ${formattedDate}
Kalan Kontenjan: ${formattedEvent.capacity - formattedEvent.enrolledStudents} kişi

Etkinliğe katılmak için lütfen aşağıdaki bağlantıyı kullanın:
[ETKINLIK_BAGLANTISI]

Saygılarımızla,
Öğretmen Takip Sistemi`
          );
        }
        
      } catch (error) {
        console.error('Error fetching event and students:', error);
        setError('Etkinlik ve öğrenci bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventAndStudents();
    }
  }, [eventId]);

  useEffect(() => {
    // Filter students based on search query and class filter
    const filtered = students.filter(student => {
      const matchesSearch = searchQuery === '' || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesClass = classFilter === 'all' || student.class === classFilter;
      
      return matchesSearch && matchesClass;
    });
    
    setFilteredStudents(filtered);
  }, [searchQuery, classFilter, students]);

  const toggleStudentSelection = (studentId: string) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, isSelected: !student.isSelected } 
          : student
      )
    );
    
    // Update selected students list
    const updatedStudents = students.map(student => 
      student.id === studentId 
        ? { ...student, isSelected: !student.isSelected } 
        : student
    );
    
    setSelectedStudents(updatedStudents.filter(student => student.isSelected));
  };

  const selectAll = () => {
    setStudents(prevStudents => 
      prevStudents.map(student => ({ ...student, isSelected: true }))
    );
    setSelectedStudents(students);
  };

  const deselectAll = () => {
    setStudents(prevStudents => 
      prevStudents.map(student => ({ ...student, isSelected: false }))
    );
    setSelectedStudents([]);
  };

  const copyInviteLink = () => {
    // In a real app, generate and copy a shareable link
    navigator.clipboard.writeText(`https://example.com/events/${eventId}/join`);
    setLinkCopied(true);
    
    toast({
      title: "Bağlantı kopyalandı",
      description: "Etkinlik davet bağlantısı panoya kopyalandı.",
    });
    
    // Reset the copied state after a delay
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const openSendEmailDialog = () => {
    if (selectedStudents.length === 0) {
      toast({
        title: "Öğrenci seçilmedi",
        description: "Lütfen davet göndermek için en az bir öğrenci seçin.",
        variant: "destructive",
      });
      return;
    }
    
    setSendEmailDialog(true);
  };

  const sendInvitations = async () => {
    try {
      // In a real app, send API request to send invitations
      // For demo, we'll simulate a successful invitation
      
      toast({
        title: "Davetler gönderildi",
        description: `${selectedStudents.length} öğrenciye davet e-postası gönderildi.`,
      });
      
      setSendEmailDialog(false);
      
      // Navigate back to event detail page or participants page
      router.push(`/tutor/events/${eventId}/participants`);
      
    } catch (error) {
      console.error('Error sending invitations:', error);
      toast({
        title: "Hata",
        description: "Davetler gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const getAvailableClasses = () => {
    const classes = new Set<string>();
    
    students.forEach(student => {
      if (student.class) {
        classes.add(student.class);
      }
    });
    
    return Array.from(classes).sort();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">{error || 'Etkinlik bulunamadı'}</h2>
          <p className="text-red-600 mb-4">İstediğiniz etkinlik mevcut değil veya erişim izniniz yok.</p>
          <Button asChild>
            <Link href="/tutor/events">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Etkinlik Listesine Dön
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button variant="outline" size="sm" className="mr-4" asChild>
            <Link href={`/tutor/events/${eventId}`}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Etkinliğe Dön
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Öğrenci Davet Et
              </span>
            </h1>
            <p className="text-gray-500">{event.title}</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <div className="flex items-center text-sm text-gray-600 mr-2">
            <Users className="h-4 w-4 mr-1" />
            <span>{event.enrolledStudents}/{event.capacity} Katılımcı</span>
          </div>
          
          <Button variant="outline" onClick={copyInviteLink}>
            <Link2 className="mr-2 h-4 w-4" />
            {linkCopied ? "Kopyalandı!" : "Bağlantıyı Kopyala"}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - Student list */}
        <div className="lg:col-span-2">
          <Card className="border border-gray-200 shadow-sm mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex-1 min-w-[280px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input 
                      placeholder="İsim, ID veya e-posta ile ara..." 
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="w-[150px]">
                      <div className="flex items-center">
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Sınıf" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Sınıflar</SelectItem>
                      {getAvailableClasses().map(classValue => (
                        <SelectItem key={classValue} value={classValue}>
                          {classValue}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button variant="ghost" size="icon" onClick={() => {
                    setSearchQuery('');
                    setClassFilter('all');
                  }}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-500">
                  {filteredStudents.length} öğrenci gösteriliyor
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Tümünü Seç
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Seçimi Kaldır
                  </Button>
                </div>
              </div>
            </CardContent>
            
            <div className="relative overflow-x-auto rounded-md border mx-6 mb-6">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 w-10">
                      <span className="sr-only">Seç</span>
                    </th>
                    <th scope="col" className="px-4 py-3">Öğrenci</th>
                    <th scope="col" className="px-4 py-3">Sınıf</th>
                    <th scope="col" className="px-4 py-3">E-posta</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student) => (
                      <tr key={student.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-4 py-3 w-10">
                          <Checkbox 
                            checked={student.isSelected} 
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Avatar className="h-8 w-8 mr-3">
                              <AvatarFallback className="bg-blue-100 text-blue-600">
                                {student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-500">#{student.studentId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="bg-gray-100 font-normal">
                            {student.class}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {student.email}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center">
                        <User className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-gray-500">Arama kriterlerinize uygun öğrenci bulunamadı.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
        
        {/* Sidebar - Selected students and actions */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-gray-200 shadow-sm sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="mr-2 h-5 w-5 text-blue-500" />
                Davet İşlemleri
              </CardTitle>
              <CardDescription>
                Seçilen öğrencileri etkinliğe davet edin
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Seçilen Öğrenciler:</h3>
                <div className="bg-gray-50 rounded-md border p-3 min-h-[100px] max-h-[200px] overflow-y-auto">
                  {students.filter(s => s.isSelected).length > 0 ? (
                    <div className="space-y-2">
                      {students.filter(s => s.isSelected).map(student => (
                        <div key={student.id} className="flex items-center justify-between">
                          <div className="flex items-center">
                            <Avatar className="h-6 w-6 mr-2">
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                                {student.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{student.name}</span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="h-6 w-6 p-1"
                            onClick={() => toggleStudentSelection(student.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-3 text-sm">
                      Henüz öğrenci seçilmedi
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {students.filter(s => s.isSelected).length} öğrenci seçildi
                </p>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-700">Davet Seçenekleri:</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="inviteLink">Davet Bağlantısı</Label>
                    <div className="flex">
                      <Input
                        id="inviteLink"
                        value={`https://example.com/events/${eventId}/join`}
                        readOnly
                        className="rounded-r-none"
                      />
                      <Button 
                        className="rounded-l-none" 
                        variant="secondary"
                        onClick={copyInviteLink}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button variant="outline" asChild>
                <Link href={`/tutor/events/${eventId}`}>
                  İptal
                </Link>
              </Button>
              <Button onClick={openSendEmailDialog} disabled={students.filter(s => s.isSelected).length === 0}>
                <Mail className="mr-2 h-4 w-4" />
                E-posta Gönder
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      
      {/* Email Dialog */}
      <Dialog open={sendEmailDialog} onOpenChange={setSendEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>E-posta Davetleri Gönder</DialogTitle>
            <DialogDescription>
              {students.filter(s => s.isSelected).length} öğrenciye davet e-postası gönderiliyor.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="emailSubject">E-posta Konusu</Label>
              <Input
                id="emailSubject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emailBody">E-posta İçeriği</Label>
              <Textarea
                id="emailBody"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="min-h-[200px]"
              />
            </div>
            
            <div className="bg-gray-50 p-3 rounded-md border text-sm">
              <h4 className="font-medium mb-1">Alıcılar:</h4>
              <div className="flex flex-wrap gap-1">
                {students.filter(s => s.isSelected).map(student => (
                  <Badge key={student.id} variant="secondary" className="bg-blue-100 text-blue-800">
                    {student.name} &lt;{student.email}&gt;
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialog(false)}>
              İptal
            </Button>
            <Button onClick={sendInvitations}>
              <Mail className="mr-2 h-4 w-4" />
              Davetleri Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 