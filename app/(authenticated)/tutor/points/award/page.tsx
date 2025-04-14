'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, Search, User, UserCheck } from 'lucide-react';

// Types
type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
};

// Award reasons presets to help tutors
const AWARD_REASON_PRESETS = [
  { label: 'Ders Katılımı', description: 'Derse aktif katılım ve yerinde katkılar için' },
  { label: 'Ödev Başarısı', description: 'Ödevde gösterilen üstün performans için' },
  { label: 'Yardımseverlik', description: 'Diğer öğrencilere yardım ve destek için' },
  { label: 'İlerleme Kaydı', description: 'Sürekli ve kayda değer ilerleme gösterdiği için' },
  { label: 'Proje Başarısı', description: 'Proje çalışmasında gösterilen yaratıcılık ve çaba için' },
  { label: 'Ekstra Çalışma', description: 'Ders dışı ekstra çalışma ve araştırma için' },
];

export default function AwardPointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [points, setPoints] = useState<number>(10); // Default to 10 points
  const [reason, setReason] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  // Fetch students
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/users?role=student');
        const data = await response.json();
        
        if (data.users) {
          setStudents(data.users.map((user: any) => ({
            id: user._id || user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            points: user.points || 0
          })));
        }
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Öğrenciler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudents();
  }, []);
  
  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (student.firstName && student.firstName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (student.lastName && student.lastName.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  // Handle preset reason selection
  const selectReasonPreset = (preset: { label: string, description: string }) => {
    setReason(preset.description);
  };
  
  // Handle award points submission
  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStudent) {
      toast.error('Lütfen bir öğrenci seçin');
      return;
    }
    
    if (points <= 0) {
      toast.error('Puan 0\'dan büyük olmalıdır');
      return;
    }
    
    if (!reason.trim()) {
      toast.error('Lütfen bir sebep belirtin');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          points,
          reason,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Puan verme işlemi başarısız oldu');
      }
      
      // Update the student's points in the local state
      setStudents(prev => 
        prev.map(s => 
          s.id === selectedStudent.id 
            ? { ...s, points: data.newBalance } 
            : s
        )
      );
      
      setSuccess(true);
      toast.success(`${selectedStudent.username} kullanıcısına ${points} puan verildi`);
      
      // Reset form
      setTimeout(() => {
        setSelectedStudent(null);
        setPoints(10);
        setReason('');
        setSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error awarding points:', error);
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to get student display name
  const getStudentDisplayName = (student: Student): string => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="mr-2" 
          onClick={() => router.push('/tutor/points')}
        >
          <ArrowLeft className="mr-1" />
        </Button>
        <h1 className="text-3xl font-bold text-gray-800">
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Puan Ver
          </span>
        </h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Student Selection */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <User className="mr-2" />
                Öğrenci Seç
              </CardTitle>
              <CardDescription>
                Puan vermek istediğiniz öğrenciyi seçin
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="İsim veya kullanıcı adı ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="bg-gray-50 rounded-md p-2 max-h-[500px] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <ul className="space-y-2">
                      {filteredStudents.map((student) => (
                        <li key={student.id}>
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className={`w-full text-left px-4 py-3 rounded-md transition-all ${
                              selectedStudent?.id === student.id
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'hover:bg-gray-100 border border-transparent'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium">
                                  {student.firstName && student.lastName
                                    ? `${student.firstName} ${student.lastName}`
                                    : student.username}
                                </span>
                                {(student.firstName || student.lastName) && (
                                  <p className="text-xs text-gray-500">@{student.username}</p>
                                )}
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {student.points} puan
                              </Badge>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      {searchTerm ? 'Arama sonucu bulunamadı' : 'Hiç öğrenci yok'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Right Column - Award Points Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-green-700">
                <Award className="mr-2" />
                {selectedStudent 
                  ? `${getStudentDisplayName(selectedStudent)} için Puan Ver` 
                  : 'Puan Verme Formu'}
              </CardTitle>
              <CardDescription>
                {selectedStudent 
                  ? `Mevcut puanı: ${selectedStudent.points}` 
                  : 'Sol taraftan bir öğrenci seçin'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedStudent ? (
                <form onSubmit={handleAwardPoints} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 mr-4">
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h3 className="font-medium text-blue-800">
                          {getStudentDisplayName(selectedStudent)}
                        </h3>
                        <p className="text-sm text-blue-600">@{selectedStudent.username}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-gray-700">Puan Miktarı</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                        required
                        className="w-full"
                      />
                      <div className="flex space-x-1">
                        {[5, 10, 20, 50].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant="outline"
                            className={`px-3 py-1 h-10 ${points === preset ? 'bg-green-100 border-green-300 text-green-700' : ''}`}
                            onClick={() => setPoints(preset)}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reason" className="text-gray-700 block mb-1">Sebep</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                        {AWARD_REASON_PRESETS.map((preset, index) => (
                          <Button
                            key={index}
                            type="button"
                            variant="outline"
                            className={`justify-start h-auto py-2 px-3 text-left ${
                              reason === preset.description 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                            onClick={() => selectReasonPreset(preset)}
                          >
                            <div>
                              <p className="font-medium">{preset.label}</p>
                              <p className="text-xs text-gray-500 truncate">{preset.description.substring(0, 20)}...</p>
                            </div>
                          </Button>
                        ))}
                      </div>
                      <Textarea
                        id="reason"
                        placeholder="Puanın neden verildiğini açıklayın..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required
                        className="w-full min-h-[120px]"
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    {success ? (
                      <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-200 text-center">
                        <Award className="mx-auto h-8 w-8 text-green-500 mb-2" />
                        <p className="font-medium">Puan başarıyla verildi!</p>
                        <p className="text-sm text-green-600 mt-1">
                          {selectedStudent.username} kullanıcısına {points} puan verildi.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 h-12 text-lg"
                        disabled={isSubmitting || !selectedStudent || points <= 0 || !reason.trim()}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent"></div>
                            İşleniyor...
                          </>
                        ) : (
                          <>
                            <Award className="mr-2" /> Puan Ver
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-4">
                    <User size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">Öğrenci Seçilmedi</h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Puan vermek için lütfen sol taraftan bir öğrenci seçin. Arama kutusunu kullanarak öğrenciyi daha hızlı bulabilirsiniz.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 