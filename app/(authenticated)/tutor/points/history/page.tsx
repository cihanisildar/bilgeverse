'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { ArrowLeft, Clock, Download, Filter, Search } from 'lucide-react';

// Types
type Transaction = {
  id: string;
  student: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  points: number;
  type: "AWARD" | "REDEEM";
  reason: string;
  createdAt: string;
};

type Student = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

export default function PointsHistoryPage() {
  const router = useRouter();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  
  // Fetch transactions and students
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all transactions
        const transactionsRes = await fetch('/api/points');
        const transactionsData = await transactionsRes.json();
        
        if (transactionsData.transactions) {
          setTransactions(transactionsData.transactions);
          setFilteredTransactions(transactionsData.transactions);
        }
        
        // Fetch students assigned to this tutor
        const studentsRes = await fetch('/api/users?role=student');
        const studentsData = await studentsRes.json();
        
        if (studentsData.users) {
          setStudents(studentsData.users.map((user: any) => ({
            id: user._id || user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
          })));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Veriler yüklenirken bir hata oluştu.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Apply filters whenever filter states change
  useEffect(() => {
    let result = [...transactions];
    
    // Filter by student
    if (selectedStudent !== 'all') {
      result = result.filter(transaction => 
        transaction.student.id === selectedStudent
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(transaction => 
        (transaction.student.username && transaction.student.username.toLowerCase().includes(searchLower)) ||
        (transaction.student.firstName && transaction.student.firstName.toLowerCase().includes(searchLower)) ||
        (transaction.student.lastName && transaction.student.lastName.toLowerCase().includes(searchLower)) ||
        transaction.reason.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort transactions
    if (sortOrder === 'newest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortOrder === 'oldest') {
      result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortOrder === 'highest') {
      result.sort((a, b) => b.points - a.points);
    } else if (sortOrder === 'lowest') {
      result.sort((a, b) => a.points - b.points);
    }
    
    setFilteredTransactions(result);
  }, [transactions, searchTerm, selectedStudent, sortOrder]);
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  
  // Get student display name
  const getStudentName = (student: any) => {
    if (student.firstName && student.lastName) {
      return `${student.firstName} ${student.lastName}`;
    }
    return student.username;
  };
  
  // Export transactions as CSV
  const exportAsCSV = () => {
    const headers = ['Öğrenci', 'Puan', 'Sebep', 'Tarih'];
    
    const csvData = filteredTransactions.map(transaction => [
      getStudentName(transaction.student),
      transaction.points,
      transaction.reason,
      formatDate(transaction.createdAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `puan-gecmisi-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="mr-2" 
            onClick={() => router.push('/tutor/points')}
          >
            <ArrowLeft className="mr-1" />
          </Button>
          <h1 className="text-3xl font-bold text-gray-800">
            <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Puan Geçmişi
            </span>
          </h1>
        </div>
        
        <Button 
          onClick={exportAsCSV}
          className="mt-4 sm:mt-0 bg-teal-500 hover:bg-teal-600"
        >
          <Download className="mr-2" /> CSV İndir
        </Button>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Filter className="mr-2" />
            Filtreler
          </CardTitle>
          <CardDescription>
            İşlemleri filtrelemek için aşağıdaki seçenekleri kullanın
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Arama</label>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="İsim veya açıklama ile ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Öğrenci</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Öğrenci seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Öğrenciler</SelectItem>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.firstName && student.lastName 
                        ? `${student.firstName} ${student.lastName}` 
                        : student.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Sıralama</label>
              <Select value={sortOrder} onValueChange={setSortOrder}>
                <SelectTrigger>
                  <SelectValue placeholder="Sıralama seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">En Yeni</SelectItem>
                  <SelectItem value="oldest">En Eski</SelectItem>
                  <SelectItem value="highest">En Yüksek Puan</SelectItem>
                  <SelectItem value="lowest">En Düşük Puan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Transactions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-blue-700">
            <Clock className="mr-2" />
            İşlem Geçmişi
          </CardTitle>
          <CardDescription>
            {filteredTransactions.length} işlem gösteriliyor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredTransactions.length > 0 ? (
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div 
                  key={transaction.id} 
                  className="bg-white border border-gray-100 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                    <div className="mb-3 sm:mb-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium text-gray-900">
                          {getStudentName(transaction.student)}
                        </h3>
                        <Badge className={`${
                          transaction.type === 'AWARD' 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {transaction.type === 'AWARD' ? '+' : '-'}{Math.abs(transaction.points)} puan
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(transaction.createdAt)}
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-sm font-medium text-gray-600">Açıklama:</div>
                      <p className="text-gray-700">
                        {transaction.reason}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">Sonuç Bulunamadı</h3>
              <p>
                {searchTerm || selectedStudent !== 'all' 
                  ? 'Filtreleri değiştirerek daha fazla sonuç görüntüleyebilirsiniz.' 
                  : 'Henüz hiç puan işlemi yapılmamış.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 