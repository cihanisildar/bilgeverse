'use client';

import { useAuth } from '@/app/contexts/AuthContext';
import { PARTS } from '@/app/lib/parts';
import { FileText, ExternalLink, ArrowLeft, Plus, Edit2, Trash2, Loader2, Link2, Power } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Loading from '@/app/components/Loading';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
type PartPdf = {
  id: string;
  partId: number;
  title: string;
  description: string | null;
  driveLink: string;
  contentType: string | null;
  isActive: boolean;
  createdAt: string;
  uploadedBy: {
    id: string;
    username: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export default function PdfsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const [pdfs, setPdfs] = useState<Record<number, PartPdf[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedPart, setSelectedPart] = useState(0);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState<PartPdf | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    partId: 0,
    title: '',
    description: '',
    driveLink: '',
    contentType: '',
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    driveLink: '',
    contentType: '',
    isActive: true,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      fetchPdfs();
    }
  }, [user]);

  const fetchPdfs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pdfs');
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data: PartPdf[] = await response.json();
      
      // Group documents by partId (0 for dashboard, 1-10 for parts)
      const grouped: Record<number, PartPdf[]> = {};
      // Initialize dashboard (0) and all parts (1-10)
      grouped[0] = [];
      for (let i = 1; i <= 10; i++) {
        grouped[i] = [];
      }
      data.forEach((pdf) => {
        if (!grouped[pdf.partId]) {
          grouped[pdf.partId] = [];
        }
        grouped[pdf.partId].push(pdf);
      });
      
      setPdfs(grouped);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Belgeleri yüklerken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.title.trim() || !uploadForm.driveLink.trim()) {
      toast.error('Lütfen başlık ve drive linki girin');
      return;
    }

    try {
      setUploading(true);
      const response = await fetch('/api/admin/pdfs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partId: uploadForm.partId,
          title: uploadForm.title,
          description: uploadForm.description || null,
          driveLink: uploadForm.driveLink,
          contentType: uploadForm.contentType || null,
          isActive: uploadForm.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Creation failed');
      }

      toast.success('Belge başarıyla eklendi');
      setShowUploadModal(false);
      // Set selected part to the part where the document was added
      setSelectedPart(uploadForm.partId);
      setUploadForm({
        partId: selectedPart,
        title: '',
        description: '',
        driveLink: '',
        contentType: '',
        isActive: true,
      });
      // Refresh the list to show the newly added document
      await fetchPdfs();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Belge eklenirken bir hata oluştu');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedPdf || !editForm.title.trim() || !editForm.driveLink.trim()) {
      toast.error('Lütfen başlık ve drive linki girin');
      return;
    }

    try {
      setEditing(true);
      const response = await fetch(`/api/admin/pdfs/${selectedPdf.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || null,
          driveLink: editForm.driveLink,
          contentType: editForm.contentType || null,
          isActive: editForm.isActive,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Update failed');
      }

      toast.success('Belge başarıyla güncellendi');
      setShowEditModal(false);
      setSelectedPdf(null);
      fetchPdfs();
    } catch (error: any) {
      console.error('Edit error:', error);
      toast.error(error.message || 'Belge güncellenirken bir hata oluştu');
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPdf) return;

    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/pdfs/${selectedPdf.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Delete failed');
      }

      toast.success('Belge başarıyla silindi');
      setShowDeleteDialog(false);
      setSelectedPdf(null);
      fetchPdfs();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Belge silinirken bir hata oluştu');
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (pdf: PartPdf) => {
    setSelectedPdf(pdf);
    setEditForm({
      title: pdf.title,
      description: pdf.description || '',
      driveLink: pdf.driveLink,
      contentType: pdf.contentType || '',
      isActive: pdf.isActive,
    });
    setShowEditModal(true);
  };

  const openDeleteDialog = (pdf: PartPdf) => {
    setSelectedPdf(pdf);
    setShowDeleteDialog(true);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold mb-4">Bilgeder</div>
          <div className="w-full flex items-center justify-center">
            <div className="loader"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/50 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="hover:bg-gray-100 transition-all duration-200"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Bölümlere Dön
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-2xl font-bold">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
                    Belgeler
                  </span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Tüm bölümler için belgeler</p>
              </div>
            </div>
            {isAdmin && (
              <Button
                onClick={() => {
                  setUploadForm({ ...uploadForm, partId: selectedPart });
                  setShowUploadModal(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md hover:shadow-lg transition-all duration-200"
              >
                <Plus className="h-4 w-4 mr-2" />
                Belge Ekle
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Layout */}
      <div className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar - Part Selection */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/50 p-4">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">
                  Bölümler
                </h2>
                <nav className="space-y-1">
                  <button
                    onClick={() => setSelectedPart(0)}
                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                      selectedPart === 0
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      selectedPart === 0 ? 'bg-white' : 'bg-indigo-400'
                    }`}></div>
                    <span className="font-medium">Yönetim Kurulu</span>
                  </button>
                  {PARTS.filter(part => part.id !== 1 && part.id !== 10).map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 flex items-center gap-3 ${
                        selectedPart === part.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${
                        selectedPart === part.id ? 'bg-white' : 'bg-indigo-400'
                      }`}></div>
                      <span className="font-medium">{part.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Mobile Tabs */}
            <div className="lg:hidden mb-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200/50 shadow-sm p-1.5 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => setSelectedPart(0)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                      selectedPart === 0
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Yönetim Kurulu
                  </button>
                  {PARTS.filter(part => part.id !== 1 && part.id !== 10).map((part) => (
                    <button
                      key={part.id}
                      onClick={() => setSelectedPart(part.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                        selectedPart === part.id
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {part.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content for selected part */}
            {selectedPart === 0 ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-1">Bilgeder Yönetim Kurulu</h2>
                  <p className="text-gray-600">Yönetim kurulu belgeleri ve dokümanları</p>
                </div>

                {loading ? (
                  <Loading message="Belgeler yükleniyor..." />
                ) : pdfs[0]?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {pdfs[0].map((pdf) => (
                    <div
                      key={pdf.id}
                      className="group relative bg-white rounded-2xl p-6 border border-gray-200/50 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                      
                      <div className="relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <FileText className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                                {pdf.title}
                              </h3>
                            </div>
                          </div>
                        </div>

                        {pdf.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                            {pdf.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mb-4">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                            pdf.isActive 
                              ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            <Power className={`h-3 w-3 mr-1.5 ${pdf.isActive ? 'text-white' : 'text-gray-500'}`} />
                            {pdf.isActive ? 'Aktif' : 'Pasif'}
                          </span>
                        </div>

                        <div className="text-xs text-gray-500 space-y-2 mb-5 pb-5 border-b border-gray-100">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Yükleyen:</span>
                            <span className="font-semibold text-gray-700">{pdf.uploadedBy.username}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-400">Tarih:</span>
                            <span className="font-semibold text-gray-700">{formatDate(pdf.createdAt)}</span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            onClick={() => window.open(pdf.driveLink, '_blank')}
                            disabled={!pdf.isActive}
                            className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {pdf.isActive ? 'Drive\'a Git' : 'Pasif'}
                          </Button>
                          {isAdmin && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(pdf)}
                                className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openDeleteDialog(pdf)}
                                className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                      <FileText className="h-12 w-12 text-indigo-400" />
                    </div>
                    <p className="text-xl font-semibold text-gray-700 mb-2">Henüz belge eklenmemiş</p>
                    <p className="text-gray-500 mb-6">Bu bölüm için henüz belge bulunmamaktadır.</p>
                    {isAdmin && (
                      <Button
                        onClick={() => {
                          setUploadForm({ ...uploadForm, partId: 0 });
                          setShowUploadModal(true);
                        }}
                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        İlk Belge'yi Ekle
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              PARTS.filter(part => part.id !== 1 && part.id !== 10).map((part) => (
                selectedPart === part.id && (
                  <div key={part.id}>
                    <div className="mb-6">
                      <h2 className="text-2xl font-bold text-gray-800 mb-1">{part.name}</h2>
                      <p className="text-gray-600">{part.description}</p>
                    </div>

                    {loading ? (
                      <Loading message="Belgeler yükleniyor..." />
                    ) : pdfs[part.id]?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {pdfs[part.id].map((pdf) => (
                          <div
                            key={pdf.id}
                            className="group relative bg-white rounded-2xl p-6 border border-gray-200/50 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                          >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                            
                            <div className="relative">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3">
                                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                    <FileText className="h-6 w-6 text-white" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors duration-200">
                                      {pdf.title}
                                    </h3>
                                  </div>
                                </div>
                              </div>

                              {pdf.description && (
                                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">
                                  {pdf.description}
                                </p>
                              )}

                              <div className="flex items-center gap-2 mb-4">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${
                                  pdf.isActive 
                                    ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  <Power className={`h-3 w-3 mr-1.5 ${pdf.isActive ? 'text-white' : 'text-gray-500'}`} />
                                  {pdf.isActive ? 'Aktif' : 'Pasif'}
                                </span>
                              </div>

                              <div className="text-xs text-gray-500 space-y-2 mb-5 pb-5 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Yükleyen:</span>
                                  <span className="font-semibold text-gray-700">{pdf.uploadedBy.username}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-gray-400">Tarih:</span>
                                  <span className="font-semibold text-gray-700">{formatDate(pdf.createdAt)}</span>
                                </div>
                              </div>

                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => window.open(pdf.driveLink, '_blank')}
                                  disabled={!pdf.isActive}
                                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  {pdf.isActive ? 'Drive\'a Git' : 'Pasif'}
                                </Button>
                                {isAdmin && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openEditModal(pdf)}
                                      className="border-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openDeleteDialog(pdf)}
                                      className="border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all duration-200 shadow-sm hover:shadow-md"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                          <FileText className="h-12 w-12 text-indigo-400" />
                        </div>
                        <p className="text-xl font-semibold text-gray-700 mb-2">Henüz belge eklenmemiş</p>
                        <p className="text-gray-500 mb-6">Bu bölüm için henüz belge bulunmamaktadır.</p>
                        {isAdmin && (
                          <Button
                            onClick={() => {
                              setUploadForm({ ...uploadForm, partId: part.id });
                              setShowUploadModal(true);
                            }}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            İlk Belge'yi Ekle
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )
              ))
            )}
          </main>
        </div>
      </div>

      {/* Upload Modal */}
      {isAdmin && (
          <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Belge Ekle</DialogTitle>
                <DialogDescription>
                  {uploadForm.partId === 0 
                    ? 'Bilgeder Yönetim Kurulu' 
                    : PARTS.find((p) => p.id === uploadForm.partId)?.name} bölümüne belge ekleyin
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bölüm
                  </label>
                  <select
                    value={uploadForm.partId}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, partId: parseInt(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={0}>Bilgeder Yönetim Kurulu</option>
                    {PARTS.filter(part => part.id !== 10).map((part) => (
                      <option key={part.id} value={part.id}>
                        {part.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={uploadForm.title}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, title: e.target.value })
                    }
                    placeholder="Belge başlığı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drive Linki <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={uploadForm.driveLink}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, driveLink: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                    type="url"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İçerik Türü
                  </label>
                  <select
                    value={uploadForm.contentType}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, contentType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Seçiniz (Opsiyonel)</option>
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                    <option value="Görsel">Görsel</option>
                    <option value="Doküman">Doküman</option>
                    <option value="Sunum">Sunum</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <Textarea
                    value={uploadForm.description}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, description: e.target.value })
                    }
                    placeholder="Belge açıklaması (opsiyonel)"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={uploadForm.isActive}
                    onChange={(e) =>
                      setUploadForm({ ...uploadForm, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Aktif (Link erişilebilir)
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadForm({
                        partId: selectedPart,
                        title: '',
                        description: '',
                        driveLink: '',
                        contentType: '',
                        isActive: true,
                      });
                    }}
                  >
                    İptal
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !uploadForm.title.trim() || !uploadForm.driveLink.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {uploading ? 'Ekleniyor...' : 'Ekle'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      )}

      {/* Edit Modal */}
      {isAdmin && (
          <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Belge Düzenle</DialogTitle>
                <DialogDescription>Belge bilgilerini güncelleyin</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Başlık <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                    placeholder="Belge başlığı"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Drive Linki <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={editForm.driveLink}
                    onChange={(e) =>
                      setEditForm({ ...editForm, driveLink: e.target.value })
                    }
                    placeholder="https://drive.google.com/..."
                    type="url"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İçerik Türü
                  </label>
                  <select
                    value={editForm.contentType}
                    onChange={(e) =>
                      setEditForm({ ...editForm, contentType: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Seçiniz (Opsiyonel)</option>
                    <option value="PDF">PDF</option>
                    <option value="Video">Video</option>
                    <option value="Görsel">Görsel</option>
                    <option value="Doküman">Doküman</option>
                    <option value="Sunum">Sunum</option>
                    <option value="Diğer">Diğer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Açıklama
                  </label>
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    placeholder="Belge açıklaması (opsiyonel)"
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={editForm.isActive}
                    onChange={(e) =>
                      setEditForm({ ...editForm, isActive: e.target.checked })
                    }
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
                    Aktif (Link erişilebilir)
                  </label>
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setShowEditModal(false)}>
                    İptal
                  </Button>
                  <Button
                    onClick={handleEdit}
                    disabled={editing || !editForm.title.trim() || !editForm.driveLink.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    {editing ? 'Güncelleniyor...' : 'Güncelle'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      )}

      {/* Delete Dialog */}
      {isAdmin && (
          <AlertDialog 
            open={showDeleteDialog} 
            onOpenChange={(open) => {
              if (!deleting) {
                setShowDeleteDialog(open);
              }
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Belge'yi Sil</AlertDialogTitle>
                <AlertDialogDescription>
                  "{selectedPdf?.title}" adlı belgeyi silmek istediğinizden emin misiniz? Bu işlem
                  geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleting}>İptal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
                >
                  {deleting ? (
                    <span className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Siliniyor...
                    </span>
                  ) : (
                    'Sil'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
      )}
    </div>
  );
}


