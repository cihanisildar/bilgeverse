'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, UserPlus2 } from 'lucide-react';
import { UserRole } from '@prisma/client';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    requestedRole: UserRole.STUDENT,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (!formData.password || !formData.firstName || !formData.lastName) {
      setError('Şifre, ad ve soyad gereklidir');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Şifreler eşleşmiyor');
      setLoading(false);
      return;
    }

    try {
      const username = `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`.replace(/\s+/g, '');
      const email = `${username}@example.com`;

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          requestedRole: formData.requestedRole,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Kayıt talebi başarısız oldu');
      }

      setSuccess(data.message || 'Kayıt talebiniz gönderildi! Yönetici onayı bekleniyor.');
      
      setFormData({
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        requestedRole: UserRole.STUDENT,
      });

      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-red-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
        <div className="flex flex-col items-center mb-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-red-600 to-red-700 text-white flex items-center justify-center mb-3">
            <UserPlus2 size={32} />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-600 to-red-700">
            MTTB Hesap Oluşturma
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Talebiniz bir yönetici tarafından incelenecektir
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
            <p className="mt-1 text-xs text-green-600">Giriş sayfasına yönlendiriliyorsunuz...</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                Ad
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Adınız"
                disabled={loading || !!success}
              />
            </div>

            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                Soyad
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                placeholder="Soyadınız"
                disabled={loading || !!success}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              disabled={loading || !!success}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Şifre Tekrar
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              placeholder="••••••••"
              disabled={loading || !!success}
            />
          </div>

          <div>
            <label htmlFor="requestedRole" className="block text-sm font-medium text-gray-700 mb-1">
              İstenen Rol
            </label>
            <select
              id="requestedRole"
              name="requestedRole"
              value={formData.requestedRole}
              onChange={handleChange}
              className="block w-full px-3 py-2 rounded-lg border border-gray-200 shadow-sm focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
              disabled={loading || !!success}
            >
              <option value={UserRole.STUDENT}>Öğrenci</option>
              <option value={UserRole.TUTOR}>Eğitmen</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || !!success}
            className={`w-full flex items-center justify-center py-2 px-4 rounded-lg text-white text-sm font-semibold
              bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 
              transition-all duration-200 shadow-md mt-2
              ${(loading || success) ? 'opacity-75 cursor-not-allowed' : ''}`}
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Gönderiliyor...
              </>
            ) : success ? (
              'Gönderildi!'
            ) : (
              <>
                Kayıt Talebini Gönder
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/login"
            className="font-semibold text-red-600 hover:text-red-500 transition-colors duration-200"
          >
            Zaten bir hesabınız var mı? <span className="underline">Giriş yapın</span>
          </Link>
        </div>

        <div className="mt-4 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Millî Türk Talebe Birliği
        </div>
      </div>
    </div>
  );
} 