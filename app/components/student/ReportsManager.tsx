import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Edit2, FileText, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

type Report = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tutor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
};

type ReportsManagerProps = {
  studentId: string;
};

export default function ReportsManager({ studentId }: ReportsManagerProps) {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportContent, setReportContent] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReports();
  }, [studentId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/reports?studentId=${studentId}`);
      if (!response.ok) throw new Error('Failed to fetch reports');
      const data = await response.json();
      setReports(data.reports);
    } catch (error) {
      toast.error('Failed to load reports. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, title: reportTitle, content: reportContent }),
      });

      if (!response.ok) throw new Error('Failed to create report');
      
      const data = await response.json();
      setReports([data.report, ...reports]);
      setIsCreateDialogOpen(false);
      setReportTitle('');
      setReportContent('');
      
      toast.success('Report created successfully');
    } catch (error) {
      toast.error('Failed to create report. Please try again.');
    }
  };

  const handleUpdateReport = async () => {
    if (!selectedReport) return;

    try {
      const response = await fetch('/api/reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedReport.id,
          title: reportTitle,
          content: reportContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to update report');
      
      const data = await response.json();
      setReports(reports.map(report => report.id === selectedReport.id ? data.report : report));
      setIsEditDialogOpen(false);
      setSelectedReport(null);
      setReportTitle('');
      setReportContent('');
      
      toast.success('Report updated successfully');
    } catch (error) {
      toast.error('Failed to update report. Please try again.');
    }
  };

  const handleDeleteReport = (reportId: string) => {
    setReportToDelete(reportId);
    setDeleteConfirmOpen(true);
  };

  const confirmDeleteReport = async () => {
    if (!reportToDelete) return;

    try {
      const response = await fetch(`/api/reports?id=${reportToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete report');
      
      setReports(reports.filter(report => report.id !== reportToDelete));
      
      toast.success('Report deleted successfully');
    } catch (error) {
      toast.error('Failed to delete report. Please try again.');
    } finally {
      setDeleteConfirmOpen(false);
      setReportToDelete(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Öğrenci Raporları</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Rapor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Rapor Oluştur</DialogTitle>
              <DialogDescription>
                Öğrenci için yeni bir rapor oluşturun.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Rapor Başlığı
                </label>
                <Input
                  id="title"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Rapor başlığını girin..."
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="content" className="text-sm font-medium">
                  Rapor İçeriği
                </label>
                <Textarea
                  id="content"
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="Rapor içeriğini buraya yazın..."
                  className="min-h-[200px]"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                İptal
              </Button>
              <Button onClick={handleCreateReport}>
                Oluştur
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8 text-gray-500">
              Henüz rapor oluşturulmamış.
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-500" />
                      <CardTitle>{report.title}</CardTitle>
                    </div>
                    <CardDescription>
                      {report.tutor.firstName} {report.tutor.lastName} tarafından • {formatDate(report.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setSelectedReport(report);
                        setReportTitle(report.title);
                        setReportContent(report.content);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog open={deleteConfirmOpen && reportToDelete === report.id} onOpenChange={setDeleteConfirmOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Raporu Sil</AlertDialogTitle>
                          <AlertDialogDescription>
                            Bu raporu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>İptal</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDeleteReport} className="bg-red-600 hover:bg-red-700">
                            Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{report.content}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Raporu Düzenle</DialogTitle>
            <DialogDescription>
              Rapor başlığını ve içeriğini düzenleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="edit-title" className="text-sm font-medium">
                Rapor Başlığı
              </label>
              <Input
                id="edit-title"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Rapor başlığını girin..."
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-content" className="text-sm font-medium">
                Rapor İçeriği
              </label>
              <Textarea
                id="edit-content"
                value={reportContent}
                onChange={(e) => setReportContent(e.target.value)}
                placeholder="Rapor içeriğini buraya yazın..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setSelectedReport(null);
              setReportTitle('');
              setReportContent('');
            }}>
              İptal
            </Button>
            <Button onClick={handleUpdateReport}>
              Güncelle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 