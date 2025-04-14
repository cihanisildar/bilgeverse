'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const response = await fetch('/api/tutor/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Öğrenci oluşturulamadı');
      }
      
      toast.success('Öğrenci başarıyla oluşturuldu');
      router.push('/tutor/students');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/tutor/students">
              <Button variant="ghost" size="sm" className="text-gray-500">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Geri Dön
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <GraduationCap className="mr-2 h-8 w-8 text-blue-600" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Yeni Öğrenci Ekle
            </span>
          </h1>
          <p className="text-gray-500 mt-1">
            Grubunuza yeni bir öğrenci ekleyin. Öğrenci otomatik olarak size atanacaktır.
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Öğrenci Bilgileri</CardTitle>
            <CardDescription>
              Lütfen öğrencinin hesap bilgilerini girin. Yıldızlı (*) alanlar zorunludur.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Kullanıcı Adı*</Label>
                <Input
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Kullanıcı adı girin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-posta*</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="E-posta adresi girin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Şifre*</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Şifre girin"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Öğrencinin adını girin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Öğrencinin soyadını girin"
                />
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => router.push('/tutor/students')}
                >
                  İptal
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {loading ? 'Oluşturuluyor...' : 'Öğrenci Oluştur'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 