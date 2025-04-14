'use client';

import { ArrowRight, User2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Kullanıcı adı ve şifre gereklidir');
      return;
    }

    try {
      await login(username.toLowerCase(), password);
    } catch (err: any) {
      console.error('Login error:', err);
      toast.error('Giriş başarısız. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary-600 flex items-center justify-center">
            <User2 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            MTTB Sistemine Hoş Geldiniz
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Millî Türk Talebe Birliği Öğrenci Takip Sistemi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="label">
                Kullanıcı Adı
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Kullanıcı adınızı girin"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`btn btn-primary w-full flex items-center justify-center ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Giriş yapılıyor...
              </div>
            ) : (
              <div className="flex items-center">
                Giriş Yap
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              Hemen kaydolun
            </Link>
          </p>
          <p className="mt-4 text-xs text-gray-500">
            © {new Date().getFullYear()} Millî Türk Talebe Birliği
          </p>
        </div>
      </div>
    </div>
  );
} 