"use client";

import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, Save, ArrowLeft } from "lucide-react";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import toast from "react-hot-toast";

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor!");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Yeni şifre en az 6 karakter olmalıdır!");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Şifre değiştirme işlemi başarısız oldu.");
      }

      toast.success("Şifreniz başarıyla güncellendi!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Ayarlar
              </span>
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600">Hesap ayarlarınızı yönetin</p>
          </div>
          <Link
            href="/dashboard/part7/student/profile"
            className="w-full sm:w-auto flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-150 py-2 sm:py-2.5 px-4 sm:px-6 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2" />
            Profile Dön
          </Link>
        </div>

        {/* Password Change Card */}
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-600" />
              Şifre Değiştir
            </CardTitle>
            <CardDescription className="text-sm sm:text-base mt-1 sm:mt-2">
              Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirmenizi öneririz.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={handlePasswordChange} className="space-y-4 sm:space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword" className="text-sm sm:text-base">Mevcut Şifre</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    placeholder="Mevcut şifrenizi girin"
                    className="mt-1.5 sm:mt-2 text-sm sm:text-base py-2 sm:py-2.5"
                  />
                </div>

                <div>
                  <Label htmlFor="newPassword" className="text-sm sm:text-base">Yeni Şifre</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Yeni şifrenizi girin"
                    className="mt-1.5 sm:mt-2 text-sm sm:text-base py-2 sm:py-2.5"
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-sm sm:text-base">Yeni Şifre (Tekrar)</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Yeni şifrenizi tekrar girin"
                    className="mt-1.5 sm:mt-2 text-sm sm:text-base py-2 sm:py-2.5"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm sm:text-base py-2 sm:py-2.5"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-1.5 sm:mr-2"></div>
                    İşleniyor...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Save className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Şifreyi Güncelle
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 