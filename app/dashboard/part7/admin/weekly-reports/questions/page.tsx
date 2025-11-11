"use client";

import { useAuth } from "@/app/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { CheckCircle, Edit, GripVertical, Plus, Save, Trash2, X, XCircle, Search, FileText, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface WeeklyReportQuestion {
  id: string;
  text: string;
  type: "FIXED" | "VARIABLE";
  targetRole: "TUTOR" | "ASISTAN";
  orderIndex: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function QuestionManagementPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [questions, setQuestions] = useState<WeeklyReportQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    text: "",
    type: "FIXED" as "FIXED" | "VARIABLE",
    targetRole: "TUTOR" as "TUTOR" | "ASISTAN"
  });

  // Filter states
  const [typeFilter, setTypeFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [roleDisplayFilter, setRoleDisplayFilter] = useState("all");
  const [typeDisplayFilter, setTypeDisplayFilter] = useState("all");

  const isAdmin = user?.role === "ADMIN";
  const isAuthenticated = user && !loading;

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      router.push("/login");
      return;
    }

    fetchQuestions();
  }, [isAuthenticated, isAdmin, router]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/weekly-reports/questions", {
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(data.questions || []);
      } else {
        throw new Error("Failed to fetch questions");
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setError("Sorular yüklenirken bir hata oluştu.");
      toast.error("Sorular yüklenirken bir hata oluştu.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.text.trim()) {
      toast.error("Soru metni gereklidir.");
      return;
    }

    try {
      const response = await fetch("/api/admin/weekly-reports/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          orderIndex: questions.length // Add to end
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions([...questions, data.question]);
        setFormData({ text: "", type: "FIXED", targetRole: "TUTOR" });
        setIsCreating(false);
        toast.success("Soru başarıyla oluşturuldu.");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to create question");
      }
    } catch (error: any) {
      console.error("Error creating question:", error);
      toast.error(error.message || "Soru oluşturulurken bir hata oluştu.");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<WeeklyReportQuestion>) => {
    try {
      const response = await fetch(`/api/admin/weekly-reports/questions/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setQuestions(questions.map(q => q.id === id ? { ...q, ...data.question } : q));
        setEditingId(null);
        toast.success("Soru başarıyla güncellendi.");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to update question");
      }
    } catch (error: any) {
      console.error("Error updating question:", error);
      toast.error(error.message || "Soru güncellenirken bir hata oluştu.");
    }
  };

  const handleDelete = (id: string) => {
    setQuestionToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      const response = await fetch(`/api/admin/weekly-reports/questions/${questionToDelete}`, {
        method: "DELETE",
        credentials: 'include',
      });

      if (response.ok) {
        setQuestions(questions.filter(q => q.id !== questionToDelete));
        toast.success("Soru başarıyla silindi.");
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete question");
      }
    } catch (error: any) {
      console.error("Error deleting question:", error);
      toast.error(error.message || "Soru silinirken bir hata oluştu.");
    } finally {
      setDeleteConfirmOpen(false);
      setQuestionToDelete(null);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await handleUpdate(id, { isActive: !isActive });
  };

  const getTypeLabel = (type: string) => {
    return type === "FIXED" ? "Sabit" : "Değişken";
  };

  const getRoleLabel = (role: string) => {
    return role === "TUTOR" ? "Rehber" : "Rehber Yardımcısı";
  };

  // Searchable Select Component
  const SearchableSelect = <T extends string>({ 
    value, 
    onValueChange, 
    options, 
    placeholder, 
    searchPlaceholder,
    filter,
    onFilterChange 
  }: {
    value: T;
    onValueChange: (value: T) => void;
    options: { value: T; label: string }[];
    placeholder: string;
    searchPlaceholder: string;
    filter: string;
    onFilterChange: (value: string) => void;
  }) => {
    const filteredOptions = options.filter(option => 
      option.label.toLowerCase().includes(filter.toLowerCase())
    );

    return (
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-10 mb-2"
          />
        </div>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  const groupedQuestions = questions
    .filter(question => {
      const roleMatch = roleDisplayFilter === "all" || question.targetRole === roleDisplayFilter;
      const typeMatch = typeDisplayFilter === "all" || question.type === typeDisplayFilter;
      return roleMatch && typeMatch;
    })
    .reduce((acc, question) => {
      const key = `${question.type}_${question.targetRole}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(question);
      return acc;
    }, {} as Record<string, WeeklyReportQuestion[]>);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="text-center">Sorular yükleniyor...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 to-white">
        <div className="px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      <div className="px-4 py-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/20 shadow-xl mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10"></div>
          <div className="relative px-8 py-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent">
                      Soru Yönetimi
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full mt-2"></div>
                  </div>
                </div>
                <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
                  Haftalık rapor formlarında kullanılacak soruları oluşturun, düzenleyin ve yönetin
                </p>
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Toplam {questions.length} soru</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Aktif dönem</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => router.push("/dashboard/part7/admin/weekly-reports")}
                  variant="outline"
                  className="group border-gray-300 hover:border-gray-400 bg-white/50 hover:bg-white text-gray-700 hover:text-gray-900 shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-0.5 transition-transform duration-300" />
                  <span className="font-medium">Geri Dön</span>
                </Button>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <Plus className="h-4 w-4 mr-2 relative z-10" />
                  <span className="relative z-10 font-medium">Yeni Soru</span>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <Label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  Filtreler:
                </Label>
                
                {/* All Filter Buttons in One Line */}
                <div className="flex flex-wrap gap-2">
                  {/* Role Filter Buttons */}
                  <span className="text-sm text-gray-600 mr-2 self-center">Rol:</span>
                  <Button
                    variant={roleDisplayFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoleDisplayFilter("all")}
                    className={roleDisplayFilter === "all" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Hepsi
                  </Button>
                  <Button
                    variant={roleDisplayFilter === "TUTOR" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoleDisplayFilter("TUTOR")}
                    className={roleDisplayFilter === "TUTOR" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Rehber
                  </Button>
                  <Button
                    variant={roleDisplayFilter === "ASISTAN" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setRoleDisplayFilter("ASISTAN")}
                    className={roleDisplayFilter === "ASISTAN" ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Rehber Yardımcısı
                  </Button>

                  {/* Type Filter Buttons */}
                  <span className="text-sm text-gray-600 mr-2 self-center ml-4">Tip:</span>
                  <Button
                    variant={typeDisplayFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeDisplayFilter("all")}
                    className={typeDisplayFilter === "all" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Hepsi
                  </Button>
                  <Button
                    variant={typeDisplayFilter === "FIXED" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeDisplayFilter("FIXED")}
                    className={typeDisplayFilter === "FIXED" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Sabit
                  </Button>
                  <Button
                    variant={typeDisplayFilter === "VARIABLE" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTypeDisplayFilter("VARIABLE")}
                    className={typeDisplayFilter === "VARIABLE" ? "bg-purple-600 hover:bg-purple-700 text-white" : "bg-white text-black hover:bg-gray-100"}
                  >
                    Değişken
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create new question form */}
        {isCreating && (
          <Card className="mb-8 border-l-4 border-l-indigo-500">
            <CardHeader>
              <CardTitle>Yeni Soru Oluştur</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="text">Soru Metni</Label>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  placeholder="Soru metnini buraya yazın..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Soru Tipi</Label>
                  <SearchableSelect
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as "FIXED" | "VARIABLE" })}
                    options={[
                      { value: "FIXED" as const, label: "Sabit" },
                      { value: "VARIABLE" as const, label: "Değişken" }
                    ]}
                    placeholder="Soru tipini seçin"
                    searchPlaceholder="Soru tipi ara..."
                    filter={typeFilter}
                    onFilterChange={setTypeFilter}
                  />
                </div>

                <div>
                  <Label htmlFor="targetRole">Hedef Rol</Label>
                  <SearchableSelect
                    value={formData.targetRole}
                    onValueChange={(value) => setFormData({ ...formData, targetRole: value as "TUTOR" | "ASISTAN" })}
                    options={[
                      { value: "TUTOR" as const, label: "Rehber" },
                      { value: "ASISTAN" as const, label: "Rehber Yardımcısı" }
                    ]}
                    placeholder="Hedef rolü seçin"
                    searchPlaceholder="Hedef rol ara..."
                    filter={roleFilter}
                    onFilterChange={setRoleFilter}
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsCreating(false);
                  setFormData({ text: "", type: "FIXED", targetRole: "TUTOR" });
                }}>
                  <X className="h-4 w-4 mr-2" />
                  İptal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Questions grouped by type and role */}
        <div className="space-y-8">
          {Object.entries(groupedQuestions).map(([key, questionsGroup]) => {
            const [type, role] = key.split('_');
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Badge variant="secondary">{getTypeLabel(type)}</Badge>
                    <Badge variant="outline">{getRoleLabel(role)}</Badge>
                    <span className="text-sm font-normal text-gray-500">
                      ({questionsGroup.length} soru)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {questionsGroup
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((question) => (
                        <div
                          key={question.id}
                          className={`p-4 border rounded-lg ${question.isActive ? 'bg-white' : 'bg-gray-50'}`}
                        >
                          {editingId === question.id ? (
                            <EditQuestionForm
                              question={question}
                              onSave={(updates) => handleUpdate(question.id, updates)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <GripVertical className="h-4 w-4 text-gray-400" />
                                  <span className="text-sm text-gray-500">#{question.orderIndex + 1}</span>
                                  {question.isActive ? (
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  ) : (
                                    <XCircle className="h-4 w-4 text-red-600" />
                                  )}
                                </div>
                                <p className="text-gray-800">{question.text}</p>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleToggleActive(question.id, question.isActive)}
                                >
                                  {question.isActive ? "Pasifleştir" : "Aktifleştir"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingId(question.id)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <AlertDialog open={deleteConfirmOpen && questionToDelete === question.id} onOpenChange={setDeleteConfirmOpen}>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDelete(question.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Soruyu Sil</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Bu soruyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>İptal</AlertDialogCancel>
                                      <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
                                        Sil
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {Object.keys(groupedQuestions).length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">Henüz soru oluşturulmamış.</p>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 text-white hover:to-purple-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              İlk Soruyu Oluştur
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EditQuestionFormProps {
  question: WeeklyReportQuestion;
  onSave: (updates: Partial<WeeklyReportQuestion>) => void;
  onCancel: () => void;
}

function EditQuestionForm({ question, onSave, onCancel }: EditQuestionFormProps) {
  const [formData, setFormData] = useState({
    text: question.text,
    type: question.type as "FIXED" | "VARIABLE",
    targetRole: question.targetRole as "TUTOR" | "ASISTAN"
  });

  // Filter states for edit form
  const [editTypeFilter, setEditTypeFilter] = useState("");
  const [editRoleFilter, setEditRoleFilter] = useState("");

  const handleSave = () => {
    if (!formData.text.trim()) {
      toast.error("Soru metni gereklidir.");
      return;
    }
    onSave(formData);
  };

  // Searchable Select Component for Edit Form
  const SearchableSelect = <T extends string>({ 
    value, 
    onValueChange, 
    options, 
    placeholder, 
    searchPlaceholder,
    filter,
    onFilterChange 
  }: {
    value: T;
    onValueChange: (value: T) => void;
    options: { value: T; label: string }[];
    placeholder: string;
    searchPlaceholder: string;
    filter: string;
    onFilterChange: (value: string) => void;
  }) => {
    const filteredOptions = options.filter(option => 
      option.label.toLowerCase().includes(filter.toLowerCase())
    );

    return (
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder={searchPlaceholder}
            value={filter}
            onChange={(e) => onFilterChange(e.target.value)}
            className="pl-10 mb-2"
          />
        </div>
        <Select value={value} onValueChange={onValueChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {filteredOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="edit-text">Soru Metni</Label>
        <Textarea
          id="edit-text"
          value={formData.text}
          onChange={(e) => setFormData({ ...formData, text: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="edit-type">Soru Tipi</Label>
          <SearchableSelect
            value={formData.type}
            onValueChange={(value) => setFormData({ ...formData, type: value as "FIXED" | "VARIABLE" })}
            options={[
              { value: "FIXED" as const, label: "Sabit" },
              { value: "VARIABLE" as const, label: "Değişken" }
            ]}
            placeholder="Soru tipini seçin"
            searchPlaceholder="Soru tipi ara..."
            filter={editTypeFilter}
            onFilterChange={setEditTypeFilter}
          />
        </div>

        <div>
          <Label htmlFor="edit-targetRole">Hedef Rol</Label>
          <SearchableSelect
            value={formData.targetRole}
            onValueChange={(value) => setFormData({ ...formData, targetRole: value as "TUTOR" | "ASISTAN" })}
            options={[
              { value: "TUTOR" as const, label: "Rehber" },
              { value: "ASISTAN" as const, label: "Rehber Yardımcısı" }
            ]}
            placeholder="Hedef rolü seçin"
            searchPlaceholder="Hedef rol ara..."
            filter={editRoleFilter}
            onFilterChange={setEditRoleFilter}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
          <Save className="h-4 w-4 mr-2" />
          Kaydet
        </Button>
        <Button variant="outline" onClick={onCancel}>
          <X className="h-4 w-4 mr-2" />
          İptal
        </Button>
      </div>
    </div>
  );
}