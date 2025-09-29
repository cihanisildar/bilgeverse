'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/app/contexts/AuthContext';
import { PeriodStatus } from '@prisma/client';
import { Clock, Plus, Play, Pause, Archive, Calendar, BarChart3, Users, Activity, Trash2, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Period {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: PeriodStatus;
  createdAt: string;
  _count: {
    events: number;
    pointsTransactions: number;
    experienceTransactions: number;
    itemRequests: number;
    wishes: number;
    studentNotes: number;
    studentReports: number;
    announcements: number;
  };
}

interface CreatePeriodData {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

export default function PeriodsPage() {
  const { data: session } = useSession();
  const { refreshUser } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createData, setCreateData] = useState<CreatePeriodData>({
    name: '',
    description: '',
    startDate: '',
    endDate: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [operationLoading, setOperationLoading] = useState<{
    [key: string]: boolean;
  }>({});
  const [dialogState, setDialogState] = useState<{
    type: 'activate' | 'delete' | null;
    period?: Period;
    message?: string;
    resetData?: boolean;
  }>({ type: null });

  const fetchPeriods = async () => {
    try {
      const response = await fetch('/api/admin/periods');
      if (!response.ok) throw new Error('Failed to fetch periods');
      const data = await response.json();
      setPeriods(data.periods);
    } catch (error) {
      setError('Failed to load periods');
      console.error('Error fetching periods:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchPeriods();
    }
  }, [session]);

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.name || !createData.startDate) {
      setError('Period name and start date are required');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/periods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create period');
      }

      await fetchPeriods();
      setShowCreateForm(false);
      setCreateData({ name: '', description: '', startDate: '', endDate: '' });
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleActivatePeriod = async (periodId: string, resetData: boolean = true) => {
    const period = periods.find(p => p.id === periodId);
    if (period) {
      setDialogState({
        type: 'activate',
        period,
        resetData
      });
    }
  };

  const confirmActivatePeriod = async () => {
    if (!dialogState.period) return;

    setOperationLoading(prev => ({ ...prev, [`activate-${dialogState.period!.id}`]: true }));

    try {
      const response = await fetch(`/api/admin/periods/${dialogState.period.id}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetData: dialogState.resetData })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to activate period');
      }

      const result = await response.json();
      console.log('Period activation result:', result);

      // If user data was reset, refresh user data across the app
      if (result.resetData) {
        console.log('User data was reset, refreshing user data...');
        await refreshUser();
        // Small delay to ensure fresh data is propagated
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      await fetchPeriods();
      setDialogState({ type: null });
    } catch (error: any) {
      setError(error.message);
      setDialogState({ type: null });
    } finally {
      setOperationLoading(prev => ({ ...prev, [`activate-${dialogState.period!.id}`]: false }));
    }
  };

  const handleUpdatePeriodStatus = async (periodId: string, newStatus: PeriodStatus) => {
    setOperationLoading(prev => ({ ...prev, [`update-${periodId}`]: true }));

    try {
      const response = await fetch(`/api/admin/periods/${periodId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update period');
      }

      await fetchPeriods();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setOperationLoading(prev => ({ ...prev, [`update-${periodId}`]: false }));
    }
  };

  const handleDeletePeriod = async (periodId: string, periodName: string, period: Period) => {
    // Check if period has associated data
    const hasData = Object.values(period._count).some(count => count > 0);
    const dataTypes = [];
    if (period._count.events > 0) dataTypes.push(`${period._count.events} etkinlik`);
    if (period._count.pointsTransactions > 0) dataTypes.push(`${period._count.pointsTransactions} puan işlemi`);
    if (period._count.experienceTransactions > 0) dataTypes.push(`${period._count.experienceTransactions} deneyim işlemi`);
    if (period._count.itemRequests > 0) dataTypes.push(`${period._count.itemRequests} ürün isteği`);
    if (period._count.wishes > 0) dataTypes.push(`${period._count.wishes} dilek`);

    setDialogState({
      type: 'delete',
      period,
      message: hasData ? dataTypes.join(', ') : undefined
    });
  };

  const confirmDeletePeriod = async () => {
    if (!dialogState.period) return;

    setOperationLoading(prev => ({ ...prev, [`delete-${dialogState.period!.id}`]: true }));

    try {
      const response = await fetch(`/api/admin/periods/${dialogState.period.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete period');
      }

      await fetchPeriods();
      setDialogState({ type: null });
    } catch (error: any) {
      setError(error.message);
      setDialogState({ type: null });
    } finally {
      setOperationLoading(prev => ({ ...prev, [`delete-${dialogState.period!.id}`]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  const getStatusBadgeClass = (status: PeriodStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800';
      case 'ARCHIVED':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: PeriodStatus) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktif';
      case 'INACTIVE':
        return 'Pasif';
      case 'ARCHIVED':
        return 'Arşivlenmiş';
      default:
        return status;
    }
  };

  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Bu sayfaya erişim yetkiniz yok.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Clock className="h-8 w-8 text-indigo-600" />
              </div>
              Dönem Yönetimi
            </h1>
            <p className="text-gray-600 mt-2">Akademik dönemlerinizi oluşturun ve yönetin</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 shadow-lg hover:shadow-xl"
          >
            <Plus className="h-5 w-5" />
            Yeni Dönem Oluştur
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
            <div className="h-5 w-5 text-red-500">⚠️</div>
            {error}
          </div>
        )}

        {/* Create Form Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 rounded-lg">
                    <Plus className="h-6 w-6 text-indigo-600" />
                  </div>
                  Yeni Dönem Oluştur
                </h2>
                <p className="text-gray-600 mt-2">Yeni bir akademik dönem tanımlayın</p>
              </div>

              <form onSubmit={handleCreatePeriod} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Dönem Adı *</label>
                  <input
                    type="text"
                    required
                    value={createData.name}
                    onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="ör. 2024-2025 Güz Dönemi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Açıklama</label>
                  <textarea
                    value={createData.description}
                    onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    rows={3}
                    placeholder="Dönem hakkında açıklama ekleyin..."
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Başlangıç Tarihi *
                    </label>
                    <input
                      type="date"
                      required
                      value={createData.startDate}
                      onChange={(e) => setCreateData({ ...createData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      <Calendar className="h-4 w-4 inline mr-1" />
                      Bitiş Tarihi
                    </label>
                    <input
                      type="date"
                      value={createData.endDate}
                      onChange={(e) => setCreateData({ ...createData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Oluşturuluyor...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Oluştur
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  >
                    İptal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Dönemler yükleniyor...</p>
          </div>
        ) : (
          /* Periods Grid */
          <div className="space-y-6">
            {periods.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz dönem yok</h3>
                <p className="text-gray-600 mb-6">İlk akademik döneminizi oluşturmak için yukarıdaki butona tıklayın.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors duration-200 flex items-center gap-2 mx-auto"
                >
                  <Plus className="h-5 w-5" />
                  İlk Dönem Oluştur
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {periods.map((period) => (
                  <div key={period.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
                    {/* Period Header */}
                    <div className="p-6 border-b border-gray-100">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{period.name}</h3>
                          {period.description && (
                            <p className="text-gray-600 text-sm">{period.description}</p>
                          )}
                        </div>
                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(period.status)}`}>
                          {getStatusText(period.status)}
                        </span>
                      </div>

                      {/* Dates */}
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {formatDate(period.startDate)}
                        </div>
                        {period.endDate && (
                          <>
                            <span>→</span>
                            <div>{formatDate(period.endDate)}</div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Statistics */}
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="text-center p-3 bg-blue-50 rounded-xl">
                          <div className="flex items-center justify-center mb-1">
                            <Activity className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="text-xl font-bold text-blue-600">{period._count.events}</div>
                          <div className="text-xs text-blue-600 font-medium">Etkinlik</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-xl">
                          <div className="flex items-center justify-center mb-1">
                            <BarChart3 className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="text-xl font-bold text-green-600">{period._count.pointsTransactions}</div>
                          <div className="text-xs text-green-600 font-medium">Puan İşlemi</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-xl">
                          <div className="flex items-center justify-center mb-1">
                            <TrendingUp className="h-4 w-4 text-purple-600" />
                          </div>
                          <div className="text-xl font-bold text-purple-600">{period._count.experienceTransactions}</div>
                          <div className="text-xs text-purple-600 font-medium">Deneyim İşlemi</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-xl">
                          <div className="flex items-center justify-center mb-1">
                            <Users className="h-4 w-4 text-yellow-600" />
                          </div>
                          <div className="text-xl font-bold text-yellow-600">{period._count.wishes}</div>
                          <div className="text-xs text-yellow-600 font-medium">Dilek</div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        {period.status !== 'ACTIVE' && (
                          <button
                            onClick={() => handleActivatePeriod(period.id)}
                            disabled={operationLoading[`activate-${period.id}`] || operationLoading[`update-${period.id}`] || operationLoading[`delete-${period.id}`]}
                            className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                          >
                            {operationLoading[`activate-${period.id}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-700"></div>
                                Yükleniyor...
                              </>
                            ) : (
                              <>
                                <Play className="h-3 w-3" />
                                Aktifleştir
                              </>
                            )}
                          </button>
                        )}
                        {period.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleUpdatePeriodStatus(period.id, 'INACTIVE')}
                            disabled={operationLoading[`activate-${period.id}`] || operationLoading[`update-${period.id}`] || operationLoading[`delete-${period.id}`]}
                            className="flex items-center gap-1 px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                          >
                            {operationLoading[`update-${period.id}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-700"></div>
                                Yükleniyor...
                              </>
                            ) : (
                              <>
                                <Pause className="h-3 w-3" />
                                Pasifleştir
                              </>
                            )}
                          </button>
                        )}
                        {period.status !== 'ARCHIVED' && (
                          <button
                            onClick={() => handleUpdatePeriodStatus(period.id, 'ARCHIVED')}
                            disabled={operationLoading[`activate-${period.id}`] || operationLoading[`update-${period.id}`] || operationLoading[`delete-${period.id}`]}
                            className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                          >
                            {operationLoading[`update-${period.id}`] ? (
                              <>
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-700"></div>
                                Yükleniyor...
                              </>
                            ) : (
                              <>
                                <Archive className="h-3 w-3" />
                                Arşivle
                              </>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeletePeriod(period.id, period.name, period)}
                          disabled={operationLoading[`activate-${period.id}`] || operationLoading[`update-${period.id}`] || operationLoading[`delete-${period.id}`]}
                          className="flex items-center gap-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs font-medium"
                        >
                          {operationLoading[`delete-${period.id}`] ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-700"></div>
                              Yükleniyor...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-3 w-3" />
                              Sil
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Custom Dialogs */}
        <AlertDialog open={dialogState.type === 'activate'} onOpenChange={() => setDialogState({ type: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Play className="h-5 w-5 text-green-600" />
                Dönem Aktifleştir
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                <strong>{dialogState.period?.name}</strong> dönemini aktifleştirmek istediğinizden emin misiniz?
                <br /><br />
                Bu işlem:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Tüm diğer dönemleri pasifleştirecek</li>
                  {dialogState.resetData && (
                    <li className="text-red-600 font-medium">Tüm kullanıcı puanlarını ve deneyimlerini sıfırlayacak</li>
                  )}
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={operationLoading[`activate-${dialogState.period?.id}`]}>Vazgeç</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmActivatePeriod} 
                disabled={operationLoading[`activate-${dialogState.period?.id}`]}
                className="bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {operationLoading[`activate-${dialogState.period?.id}`] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Aktifleştiriliyor...
                  </>
                ) : (
                  'Aktifleştir'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={dialogState.type === 'delete'} onOpenChange={() => setDialogState({ type: null })}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Dönem Sil
              </AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                <strong>{dialogState.period?.name}</strong> dönemini kalıcı olarak silmek istediğinizden emin misiniz?
                
                {dialogState.message && (
                  <>
                    <br /><br />
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        Bu dönemde şu veriler bulunuyor:
                      </div>
                      <div className="text-yellow-700 text-sm">
                        {dialogState.message}
                      </div>
                    </div>
                  </>
                )}
                
                <br /><br />
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-red-800 font-medium">
                    <AlertTriangle className="h-4 w-4" />
                    DİKKAT: Bu işlem geri alınamaz ve tüm ilişkili veriler de silinecektir!
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={operationLoading[`delete-${dialogState.period?.id}`]}>Vazgeç</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDeletePeriod} 
                disabled={operationLoading[`delete-${dialogState.period?.id}`]}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {operationLoading[`delete-${dialogState.period?.id}`] ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Siliniyor...
                  </>
                ) : (
                  'Sil'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
}