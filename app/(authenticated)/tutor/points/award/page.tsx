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
import { Switch } from '@/components/ui/switch';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Award, Search, User, UserCheck, MinusCircle } from 'lucide-react';

// Types
type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  points: number;
};

// Add PointReason type
type PointReason = {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
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

// Decrease reasons presets
const DECREASE_REASON_PRESETS = [
  { label: 'Derse Katılmama', description: 'Derslere düzenli katılım göstermediği için' },
  { label: 'Ödev Eksikliği', description: 'Ödevlerini zamanında tamamlamadığı için' },
  { label: 'Kural İhlali', description: 'Belirlenen kuralları ihlal ettiği için' },
  { label: 'Performans Düşüklüğü', description: 'Beklenen performansın altında kaldığı için' },
  { label: 'Devamsızlık', description: 'Uzun süreli devamsızlık yaptığı için' },
  { label: 'Uygunsuz Davranış', description: 'Uygunsuz davranışlar sergilediği için' },
];

// Add new loading state types
type LoadingStates = {
  students: boolean;
  submission: boolean;
  pointsUpdate: boolean;
};

// Add new types for API response
type ApiResponse = {
  error?: string;
  details?: string;
  newBalance?: number;
};

// Add retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
};

// Add utility function for exponential backoff
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function AwardPointsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = new URLSearchParams(window.location.search);
  const studentIdFromUrl = searchParams.get('studentId');
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [points, setPoints] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    students: true,
    submission: false,
    pointsUpdate: false
  });
  const [success, setSuccess] = useState<boolean>(false);
  const [isDecreasing, setIsDecreasing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add retry count state
  const [retryCount, setRetryCount] = useState(0);
  
  // Add point reasons state
  const [pointReasons, setPointReasons] = useState<PointReason[]>([]);
  const [selectedReasonId, setSelectedReasonId] = useState<string>('');
  const [reasonSearchTerm, setReasonSearchTerm] = useState<string>('');
  
  // Fetch students and handle studentId from URL
  useEffect(() => {
    const fetchData = async () => {
      setLoadingStates(prev => ({ ...prev, students: true }));
      setError(null);
      
      try {
        // Fetch students
        const response = await fetch('/api/tutor/students', {
          credentials: 'include',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (!response.ok) {
          throw new Error('Öğrenci listesi alınamadı');
        }
        
        const data = await response.json();
        
        if (data.students) {
          const fetchedStudents = data.students.map((user: any) => ({
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            points: user.points || 0
          }));
          setStudents(fetchedStudents);
          
          if (studentIdFromUrl) {
            const studentFromUrl = fetchedStudents.find((s: Student) => s.id === studentIdFromUrl);
            if (studentFromUrl) {
              setSelectedStudent(studentFromUrl);
            }
          }
        }

        // Fetch point reasons
        const reasonsRes = await fetch('/api/tutor/point-reasons', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!reasonsRes.ok) {
          throw new Error('Puan sebepleri alınamadı');
        }

        const reasonsData = await reasonsRes.json();
        if (reasonsData.reasons) {
          setPointReasons(reasonsData.reasons.filter((r: PointReason) => r.isActive));
        }

      } catch (error: any) {
        console.error('Error fetching data:', error);
        setError(error.message || 'Veriler yüklenirken bir hata oluştu');
        toast.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoadingStates(prev => ({ ...prev, students: false }));
      }
    };
    
    fetchData();
  }, [studentIdFromUrl]);
  
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
  
  // Modified handleAwardPoints with retry logic
  const handleAwardPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setRetryCount(0);
    
    if (!selectedStudent) {
      setError('Lütfen bir öğrenci seçin');
      return;
    }
    
    if (points <= 0) {
      setError('Puan miktarı 0\'dan büyük olmalıdır');
      return;
    }

    if (isDecreasing && points > selectedStudent.points) {
      setError('Düşürülecek puan miktarı mevcut puandan fazla olamaz');
      return;
    }
    
    if (!selectedReasonId) {
      setError('Lütfen bir puan sebebi seçin');
      return;
    }

    const finalPoints = isDecreasing ? -Math.abs(points) : Math.abs(points);
    
    setLoadingStates(prev => ({ ...prev, submission: true }));
    try {
      const response = await fetch('/api/points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          points: finalPoints,
          pointReasonId: selectedReasonId,
          reason: pointReasons.find(r => r.id === selectedReasonId)?.name || ''
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to award points');
      }

      const data = await response.json();
      
      // Update the student's points in our local state
      setStudents(prev =>
        prev.map(s =>
          s.id === selectedStudent.id
            ? { ...s, points: data.newBalance }
            : s
        )
      );
      
      setSelectedStudent(prev =>
        prev ? { ...prev, points: data.newBalance } : null
      );
      
      setSuccess(true);
      toast.success(isDecreasing ? 'Puan başarıyla düşürüldü' : 'Puan başarıyla verildi');
      
      // Reset form after success
      setTimeout(() => {
        setPoints(10);
        setSelectedReasonId('');
        setSuccess(false);
      }, 2000);
      
    } catch (error: any) {
      console.error('Error processing points:', error);
      setError(
        error.message === 'TRANSACTION_TIMEOUT'
          ? 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.'
          : error.message || 'Puan işlemi sırasında bir hata oluştu'
      );
      toast.error(error.message || 'Bir hata oluştu');
    } finally {
      setLoadingStates(prev => ({ ...prev, submission: false }));
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
    <div className="px-4 py-6 space-y-8">
      {/* Enhanced Header with Mode Selection */}
      <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => router.push('/tutor/points')}
          >
            <ArrowLeft className="mr-1" />
            Geri
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            Puan Yönetimi
          </h1>
        </div>
        
        <div className="flex items-center space-x-6 bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center space-x-2">
            <Award className={`w-5 h-5 ${!isDecreasing ? 'text-green-600' : 'text-gray-400'}`} />
            <Label 
              htmlFor="mode-switch" 
              className={`font-medium cursor-pointer ${
                !isDecreasing ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              Puan Ver
            </Label>
          </div>
          <Switch
            id="mode-switch"
            checked={isDecreasing}
            onCheckedChange={setIsDecreasing}
            className={`${
              isDecreasing 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
            } transition-colors duration-200`}
          />
          <div className="flex items-center space-x-2">
            <MinusCircle className={`w-5 h-5 ${isDecreasing ? 'text-red-600' : 'text-gray-400'}`} />
            <Label 
              htmlFor="mode-switch" 
              className={`font-medium cursor-pointer ${
                isDecreasing ? 'text-red-600' : 'text-gray-400'
              }`}
            >
              Puan Düş
            </Label>
          </div>
        </div>
      </div>

      {/* Mode Indicator Banner */}
      <div className={`
        p-4 rounded-lg border flex items-center justify-between
        ${isDecreasing 
          ? 'bg-red-50 border-red-200 text-red-700' 
          : 'bg-green-50 border-green-200 text-green-700'
        }
      `}>
        <div className="flex items-center space-x-3">
          {isDecreasing ? (
            <>
              <MinusCircle className="w-6 h-6" />
              <div>
                <h3 className="font-medium">Puan Düşürme Modu</h3>
                <p className="text-sm opacity-75">Öğrencinin mevcut puanından düşürme yapabilirsiniz</p>
              </div>
            </>
          ) : (
            <>
              <Award className="w-6 h-6" />
              <div>
                <h3 className="font-medium">Puan Verme Modu</h3>
                <p className="text-sm opacity-75">Öğrencinin mevcut puanına ekleme yapabilirsiniz</p>
              </div>
            </>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsDecreasing(!isDecreasing)}
          className={`
            border-2 transition-colors duration-200
            ${isDecreasing 
              ? 'border-red-200 text-red-700 hover:bg-red-100' 
              : 'border-green-200 text-green-700 hover:bg-green-100'
            }
          `}
        >
          {isDecreasing ? 'Puan Verme Moduna Geç' : 'Puan Düşürme Moduna Geç'}
        </Button>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p className="flex items-center">
            <span className="mr-2">⚠️</span>
            {error}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Student Selection */}
        <div className="md:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center text-blue-700">
                <User className="mr-2" />
                Öğrenci Seç
              </CardTitle>
              <CardDescription>
                {isDecreasing 
                  ? 'Puanını düşürmek istediğiniz öğrenciyi seçin'
                  : 'Puan vermek istediğiniz öğrenciyi seçin'
                }
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
                    disabled={loadingStates.students}
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
                
                <div className="bg-gray-50 rounded-md p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {loadingStates.students ? (
                    <div className="flex flex-col items-center justify-center h-32 space-y-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                      <p className="text-sm text-gray-500">Öğrenciler yükleniyor...</p>
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
                              <div className="flex items-center">
                                {loadingStates.pointsUpdate && selectedStudent?.id === student.id ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                                ) : null}
                                <Badge variant="outline" className={`
                                  ${selectedStudent?.id === student.id 
                                    ? 'bg-blue-100 text-blue-700 border-blue-300' 
                                    : 'bg-blue-50 text-blue-700 border-blue-200'}
                                `}>
                                  {student.points} puan
                                </Badge>
                              </div>
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
        
        {/* Right Column - Points Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className={`flex items-center ${isDecreasing ? 'text-red-700' : 'text-green-700'}`}>
                  {isDecreasing ? <MinusCircle className="mr-2" /> : <Award className="mr-2" />}
                  {selectedStudent 
                    ? `${getStudentDisplayName(selectedStudent)} için ${isDecreasing ? 'Puan Düşürme' : 'Puan Verme'}` 
                    : 'Puan İşlemi Formu'
                  }
                </CardTitle>
              </div>
              {selectedStudent && (
                <CardDescription className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Mevcut puan:</span>
                    <Badge variant="outline" className="bg-gray-50">
                      {selectedStudent.points}
                    </Badge>
                  </div>
                  {points > 0 && (
                    <>
                      <span className="text-gray-400">→</span>
                      <div className="flex items-center">
                        <span className="font-medium mr-2">İşlem sonrası:</span>
                        <Badge 
                          variant="outline" 
                          className={`
                            ${isDecreasing 
                              ? 'bg-red-50 text-red-700 border-red-200' 
                              : 'bg-green-50 text-green-700 border-green-200'
                            }
                          `}
                        >
                          {selectedStudent.points + (isDecreasing ? -points : points)}
                        </Badge>
                      </div>
                    </>
                  )}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {selectedStudent ? (
                <form onSubmit={handleAwardPoints} className="space-y-6">
                  <div className={`${
                    isDecreasing ? 'bg-red-50 border-red-100' : 'bg-blue-50 border-blue-100'
                  } border rounded-lg p-4 mb-4 transition-colors duration-200`}>
                    <div className="flex items-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-4 ${
                        isDecreasing ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        <UserCheck size={24} />
                      </div>
                      <div>
                        <h3 className={`font-medium ${isDecreasing ? 'text-red-800' : 'text-blue-800'}`}>
                          {getStudentDisplayName(selectedStudent)}
                        </h3>
                        <p className={`text-sm ${isDecreasing ? 'text-red-600' : 'text-blue-600'}`}>
                          @{selectedStudent.username}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-gray-700 flex items-center justify-between">
                      <span>Puan Miktarı</span>
                      {points > 0 && (
                        <span className={`text-sm ${isDecreasing ? 'text-red-600' : 'text-green-600'}`}>
                          Yeni puan: {selectedStudent.points + (isDecreasing ? -points : points)}
                        </span>
                      )}
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="points"
                        type="number"
                        min="1"
                        value={points}
                        onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                        required
                        className="w-full"
                        disabled={loadingStates.submission}
                      />
                      <div className="flex space-x-1">
                        {[5, 10, 20, 50].map((preset) => (
                          <Button
                            key={preset}
                            type="button"
                            variant="outline"
                            className={`px-3 py-1 h-10 ${
                              points === preset 
                                ? isDecreasing
                                  ? 'bg-red-100 border-red-300 text-red-700'
                                  : 'bg-green-100 border-green-300 text-green-700'
                                : ''
                            }`}
                            onClick={() => setPoints(preset)}
                            disabled={loadingStates.submission}
                          >
                            {preset}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Point Reasons Selection */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="pointReason" className="text-gray-700 block mb-1">
                        Puan Sebebi
                      </Label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="Sebeplerde ara..."
                          value={reasonSearchTerm}
                          onChange={(e) => setReasonSearchTerm(e.target.value)}
                          className="mb-3"
                        />
                        <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                      </div>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto">
                        {pointReasons
                          .filter(reason =>
                            reason.name.toLowerCase().includes(reasonSearchTerm.toLowerCase()) ||
                            (reason.description && reason.description.toLowerCase().includes(reasonSearchTerm.toLowerCase()))
                          )
                          .map((reason) => (
                            <div
                              key={reason.id}
                              onClick={() => setSelectedReasonId(reason.id)}
                              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                                selectedReasonId === reason.id
                                  ? 'border-emerald-500 bg-emerald-50'
                                  : 'border-gray-200 hover:border-emerald-200 hover:bg-emerald-50/50'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{reason.name}</h4>
                                  {reason.description && (
                                    <p className="text-sm text-gray-500 mt-1">{reason.description}</p>
                                  )}
                                </div>
                                {selectedReasonId === reason.id && (
                                  <div className="text-emerald-500">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    {success ? (
                      <div className={`${
                        isDecreasing 
                          ? 'bg-red-50 text-red-700 border-red-200' 
                          : 'bg-green-50 text-green-700 border-green-200'
                      } p-4 rounded-lg border text-center transition-all duration-300`}>
                        {isDecreasing ? (
                          <MinusCircle className="mx-auto h-8 w-8 text-red-500 mb-2" />
                        ) : (
                          <Award className="mx-auto h-8 w-8 text-green-500 mb-2" />
                        )}
                        <p className="font-medium">İşlem başarıyla tamamlandı!</p>
                        <p className={`text-sm ${isDecreasing ? 'text-red-600' : 'text-green-600'} mt-1`}>
                          {selectedStudent.username} kullanıcısının {
                            isDecreasing 
                              ? 'puanından ' + points + ' düşürüldü' 
                              : 'puanına ' + points + ' eklendi'
                          }.
                        </p>
                      </div>
                    ) : (
                      <Button 
                        type="submit" 
                        className={`w-full ${
                          isDecreasing
                            ? 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700'
                            : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                        } h-12 text-lg transition-all duration-200`}
                        disabled={
                          loadingStates.submission || 
                          !selectedStudent || 
                          points <= 0 || 
                          !selectedReasonId ||
                          (isDecreasing && points > selectedStudent.points)
                        }
                      >
                        {loadingStates.submission ? (
                          <div className="flex items-center justify-center text-white">
                            <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
                            {retryCount > 0 ? `Yeniden deneniyor (${retryCount}/${RETRY_CONFIG.maxRetries})...` : 'İşleniyor...'}
                          </div>
                        ) : (
                          <div className="flex items-center justify-center text-white">
                            {isDecreasing ? <MinusCircle className="mr-2" /> : <Award className="mr-2" />}
                            {isDecreasing ? 'Puan Düş' : 'Puan Ver'}
                          </div>
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
                    Puan vermek için lütfen sol taraftan bir öğrenci seçin. 
                    Arama kutusunu kullanarak öğrenciyi daha hızlı bulabilirsiniz.
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