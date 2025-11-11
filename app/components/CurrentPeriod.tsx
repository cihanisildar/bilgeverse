'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, CheckCircle, AlertCircle, Archive } from 'lucide-react';

interface Period {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

interface CurrentPeriodProps {
  variant?: 'compact' | 'full';
  className?: string;
}

export default function CurrentPeriod({ variant = 'full', className = '' }: CurrentPeriodProps) {
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchActivePeriod = async () => {
    try {
      const response = await fetch('/api/periods/current');
      if (!response.ok) {
        if (response.status === 404) {
          setPeriod(null);
          setError('');
          return;
        }
        throw new Error('Failed to fetch active period');
      }
      const data = await response.json();
      setPeriod(data);
      setError('');
    } catch (error) {
      console.error('Error fetching active period:', error);
      setError('Aktif dönem bilgisi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePeriod();
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'INACTIVE':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'ARCHIVED':
        return <Archive className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif Dönem';
      case 'INACTIVE':
        return 'Pasif Dönem';
      case 'ARCHIVED':
        return 'Arşivlenmiş Dönem';
      default:
        return status;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ARCHIVED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    if (variant === 'compact') {
      return (
        <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
          <div className="animate-pulse flex items-center gap-3">
            <div className="rounded-full bg-gray-200 h-8 w-8"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="rounded-full bg-gray-200 h-10 w-10"></div>
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !period) {
    if (variant === 'compact') {
      return (
        <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm font-medium text-red-800">Dönem Bulunamadı</p>
              <p className="text-xs text-red-600">Aktif dönem ayarlanmamış</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-2">
          <AlertCircle className="h-6 w-6 text-red-500" />
          <h3 className="text-lg font-semibold text-red-800">Dönem Bulunamadı</h3>
        </div>
        <p className="text-red-600 mb-4">
          {error || 'Şu anda aktif bir dönem bulunmuyor. Lütfen yöneticinize başvurun.'}
        </p>
        <div className="text-sm text-red-600">
          Yöneticiler <strong>/dashboard/part7/admin/periods</strong> sayfasından dönem oluşturabilir.
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg shadow border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Clock className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-semibold text-gray-900 truncate">{period.name}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadgeClass(period.status)}`}>
                {getStatusText(period.status)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>{formatDate(period.startDate)}</span>
              {period.endDate && (
                <>
                  <span>-</span>
                  <span>{formatDate(period.endDate)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 rounded-xl">
            <Clock className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Mevcut Dönem</h3>
            <p className="text-sm text-gray-600">Aktif akademik dönem</p>
          </div>
        </div>
        <span className={`inline-flex items-center px-3 py-1 text-sm font-medium rounded-full border ${getStatusBadgeClass(period.status)}`}>
          {getStatusIcon(period.status)}
          <span className="ml-1">{getStatusText(period.status)}</span>
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-xl font-bold text-gray-900">{period.name}</h4>
          {period.description && (
            <p className="text-gray-600 mt-1">{period.description}</p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Başlangıç:</span>
            <span>{formatDate(period.startDate)}</span>
          </div>
          {period.endDate && (
            <>
              <div className="w-px h-4 bg-gray-300"></div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Bitiş:</span>
                <span>{formatDate(period.endDate)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}