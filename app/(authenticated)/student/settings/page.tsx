"use client";

import { useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, User, Bell, Palette, Save, ArrowLeft, Mail, Globe, Moon, Sun, Laptop } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import toast from "react-hot-toast";

export default function StudentSettingsPage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Mock notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [eventReminders, setEventReminders] = useState(true);
  const [pointUpdates, setPointUpdates] = useState(true);

  // Mock appearance settings
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("tr");
  const [compactMode, setCompactMode] = useState(false);

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

  const handleNotificationSave = () => {
    toast.success("Bildirim ayarları kaydedildi!");
  };

  const handleAppearanceSave = () => {
    toast.success("Görünüm ayarları kaydedildi!");
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                Ayarlar
              </span>
            </h1>
            <p className="mt-1 text-gray-600">Hesap ayarlarınızı yönetin</p>
          </div>
          <Link
            href="/student/profile"
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-150 py-2 px-4 rounded-full"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Profile Dön
          </Link>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="security" className="space-y-6">
          <TabsList className="bg-muted w-full justify-start border-b rounded-none p-0 h-12">
            <TabsTrigger
              value="security"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative h-12 px-4 rounded-none data-[state=active]:text-indigo-600 data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-indigo-600"
            >
              <Lock className="h-4 w-4 mr-2" />
              Güvenlik
            </TabsTrigger>
            <TabsTrigger
              value="notifications"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative h-12 px-4 rounded-none data-[state=active]:text-indigo-600 data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-indigo-600"
            >
              <Bell className="h-4 w-4 mr-2" />
              Bildirimler
            </TabsTrigger>
            <TabsTrigger
              value="appearance"
              className="data-[state=active]:bg-transparent data-[state=active]:shadow-none relative h-12 px-4 rounded-none data-[state=active]:text-indigo-600 data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:left-0 data-[state=active]:after:bottom-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-indigo-600"
            >
              <Palette className="h-4 w-4 mr-2" />
              Görünüm
            </TabsTrigger>
          </TabsList>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-indigo-600" />
                  Şifre Değiştir
                </CardTitle>
                <CardDescription>
                  Hesabınızın güvenliği için düzenli olarak şifrenizi değiştirmenizi öneririz.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                      <Input
                        id="currentPassword"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Mevcut şifrenizi girin"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="newPassword">Yeni Şifre</Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Yeni şifrenizi girin"
                        className="mt-1.5"
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Yeni şifrenizi tekrar girin"
                        className="mt-1.5"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        İşleniyor...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Save className="mr-2 h-4 w-4" />
                        Şifreyi Güncelle
                      </div>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  Bildirim Ayarları
                </CardTitle>
                <CardDescription>
                  Hangi durumlarda bildirim almak istediğinizi seçin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>E-posta Bildirimleri</Label>
                      <p className="text-sm text-muted-foreground">
                        Önemli güncellemeler için e-posta alın
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Etkinlik Hatırlatıcıları</Label>
                      <p className="text-sm text-muted-foreground">
                        Yaklaşan etkinlikler için hatırlatma alın
                      </p>
                    </div>
                    <Switch
                      checked={eventReminders}
                      onCheckedChange={setEventReminders}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Puan Güncellemeleri</Label>
                      <p className="text-sm text-muted-foreground">
                        Puan kazandığınızda veya harcadığınızda bildirim alın
                      </p>
                    </div>
                    <Switch
                      checked={pointUpdates}
                      onCheckedChange={setPointUpdates}
                    />
                  </div>
                  <Button
                    onClick={handleNotificationSave}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Bildirimleri Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-indigo-600" />
                  Görünüm Ayarları
                </CardTitle>
                <CardDescription>
                  Uygulama görünümünü kişiselleştirin.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Tema</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger>
                        <SelectValue placeholder="Tema seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">
                          <div className="flex items-center">
                            <Sun className="h-4 w-4 mr-2" />
                            Açık
                          </div>
                        </SelectItem>
                        <SelectItem value="dark">
                          <div className="flex items-center">
                            <Moon className="h-4 w-4 mr-2" />
                            Koyu
                          </div>
                        </SelectItem>
                        <SelectItem value="system">
                          <div className="flex items-center">
                            <Laptop className="h-4 w-4 mr-2" />
                            Sistem
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Dil</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger>
                        <SelectValue placeholder="Dil seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tr">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            Türkçe
                          </div>
                        </SelectItem>
                        <SelectItem value="en">
                          <div className="flex items-center">
                            <Globe className="h-4 w-4 mr-2" />
                            English
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Kompakt Mod</Label>
                      <p className="text-sm text-muted-foreground">
                        Daha sıkışık bir yerleşim için kompakt modu kullanın
                      </p>
                    </div>
                    <Switch
                      checked={compactMode}
                      onCheckedChange={setCompactMode}
                    />
                  </div>
                  <Button
                    onClick={handleAppearanceSave}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Görünümü Kaydet
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 