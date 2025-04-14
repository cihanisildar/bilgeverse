'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import { RegistrationRequest, RequestStatus, UserRole } from '@prisma/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, AlertCircle, CheckCircle2, XCircle, Clock, Search, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { HeaderSkeleton, RequestCardSkeleton, SearchFilterSkeleton } from '@/app/components/ui/skeleton-shimmer';

// Loading component for the requests list
function LoadingState() {
  return (
    <div className="space-y-6">
      <HeaderSkeleton />
      <SearchFilterSkeleton />
      <div className="grid gap-6">
        {[1, 2, 3].map((i) => (
          <RequestCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// Main content component
function RegistrationRequestsContent() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!user || !isAdmin) {
        router.push('/unauthorized');
        return;
      }

      const response = await fetch('/api/admin/registration-requests', {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch registration requests');
      }

      const data = await response.json();
      if (!data.requests || !Array.isArray(data.requests)) {
        throw new Error('Invalid response format');
      }

      setRequests(data.requests);
      setFilteredRequests(data.requests);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching registration requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...requests];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(request => 
        request.username.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        (request.firstName && request.firstName.toLowerCase().includes(query)) ||
        (request.lastName && request.lastName.toLowerCase().includes(query))
      );
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter as RequestStatus);
    }
    
    setFilteredRequests(filtered);
  }, [searchQuery, statusFilter, requests]);

  const handleRequest = async (requestId: string, action: 'approve' | 'reject', rejectionReason?: string) => {
    try {
      setActionLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/registration-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          requestId, 
          action, 
          rejectionReason,
          status: action === 'approve' ? RequestStatus.APPROVED : RequestStatus.REJECTED 
        })
      });

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} request`);
      }

      setRejectDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');

      await fetchRequests();
    } catch (err: any) {
      setError(err.message);
      console.error(`Error ${action}ing request:`, err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case RequestStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="w-3 h-3 mr-1" />
          Bekliyor
        </Badge>;
      case RequestStatus.APPROVED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Onaylandı
        </Badge>;
      case RequestStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="w-3 h-3 mr-1" />
          Reddedildi
        </Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  return (
    <>
      {/* Gradient Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-blue-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-white">Kayıt İstekleri</h1>
            <p className="text-indigo-100 mt-1">Kullanıcı kayıt isteklerini yönetin ve onaylayın</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-white/10 text-white border-white/20 px-3 py-1">
              <Clock className="w-4 h-4 mr-1" />
              {filteredRequests.filter(r => r.status === RequestStatus.PENDING).length} Bekleyen İstek
            </Badge>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="İsim veya e-posta ile ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            <div className="w-full sm:w-60">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Tüm İstekler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm İstekler</SelectItem>
                  <SelectItem value={RequestStatus.PENDING}>Bekleyenler</SelectItem>
                  <SelectItem value={RequestStatus.APPROVED}>Onaylananlar</SelectItem>
                  <SelectItem value={RequestStatus.REJECTED}>Reddedilenler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center text-red-700">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request Cards */}
      <Suspense fallback={<LoadingState />}>
        {filteredRequests.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12">
              <div className="text-center">
                <UserPlus className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {searchQuery || statusFilter !== 'all' 
                    ? 'Arama kriterlerine uygun istek bulunamadı'
                    : 'Henüz kayıt isteği bulunmuyor'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery || statusFilter !== 'all'
                    ? 'Farklı arama kriterleri deneyebilir veya filtreleri temizleyebilirsiniz'
                    : 'Yeni kayıt istekleri geldiğinde burada görüntülenecektir'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="border-0 shadow-lg overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                <CardHeader className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg">
                        {request.firstName 
                          ? request.firstName.charAt(0).toUpperCase()
                          : request.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-xl font-semibold">
                          {request.firstName && request.lastName 
                            ? `${request.firstName} ${request.lastName}`
                            : request.username}
                        </CardTitle>
                        <CardDescription>{request.email}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">İstenilen Rol</p>
                        <p className="mt-1 font-medium">
                          {request.requestedRole === UserRole.STUDENT ? 'Öğrenci' : 
                           request.requestedRole === UserRole.TUTOR ? 'Öğretmen' : 'Yönetici'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Kayıt Tarihi</p>
                        <p className="mt-1 font-medium">
                          {new Date(request.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    
                    {request.status === RequestStatus.REJECTED && request.rejectionReason && (
                      <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                        <p className="text-sm font-medium text-red-800 mb-1">Red Nedeni</p>
                        <p className="text-red-600">{request.rejectionReason}</p>
                      </div>
                    )}

                    {request.status === RequestStatus.PENDING && (
                      <div className="flex gap-3 mt-6">
                        <Button
                          onClick={() => handleRequest(request.id, 'approve')}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Onayla
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => {
                            setSelectedRequest(request);
                            setRejectDialogOpen(true);
                          }}
                          disabled={actionLoading}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </Suspense>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900">Kayıt İsteğini Reddet</DialogTitle>
            <DialogDescription className="mt-2 text-gray-600">
              {selectedRequest?.username} kullanıcısının kayıt isteğini reddetmek üzeresiniz.
              Lütfen red nedenini belirtin.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={4}
              placeholder="Red nedeni..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setSelectedRequest(null);
                setRejectionReason('');
              }}
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedRequest && rejectionReason) {
                  handleRequest(selectedRequest.id, 'reject', rejectionReason);
                }
              }}
              disabled={!rejectionReason || actionLoading}
            >
              {actionLoading ? 'İşleniyor...' : 'Reddet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Main page component
export default function RegistrationRequestsPage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto py-8">
      <Suspense fallback={<LoadingState />}>
        <RegistrationRequestsContent />
      </Suspense>
    </div>
  );
} 