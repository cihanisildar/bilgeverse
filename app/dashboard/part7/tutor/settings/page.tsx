"use client";

import { HeaderSkeleton } from "@/app/components/ui/skeleton-shimmer";
import { useAuth } from "@/app/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bell, ChevronRight, Layout, Lock, Save, User, XCircle } from 'lucide-react';

// Static Header Component
function SettingsHeader() {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold text-gray-800">
        <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Ayarlar
        </span>
      </h1>
      <Link 
        href="/dashboard/part7/tutor/profile" 
        className="px-4 py-2 bg-white text-indigo-600 rounded-lg shadow-sm hover:shadow-md transition-all border border-indigo-100"
      >
        Profilime Dön
      </Link>
    </div>
  );
}

// Dynamic Settings Content Component
function SettingsContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    specialization: "",
    bio: "",
  });

  // Security form state
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Notification preferences state
  const [notificationPreferences, setNotificationPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    eventReminders: true,
    studentUpdates: true,
    systemAnnouncements: true,
  });

  // Appearance preferences state
  const [appearancePreferences, setAppearancePreferences] = useState({
    theme: "light",
    compactMode: false,
    highContrast: false,
    fontSize: "medium",
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/tutor/settings', {
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();
        const { tutor } = data;

        // Update profile form
        setProfileForm({
          firstName: tutor.firstName || "",
          lastName: tutor.lastName || "",
          phone: tutor.phone || "",
          specialization: tutor.specialization || "",
          bio: tutor.bio || "",
        });

        // Update preferences if they exist
        if (tutor.preferences) {
          const { notifications, appearance } = tutor.preferences;
          if (notifications) {
            setNotificationPreferences(notifications);
          }
          if (appearance) {
            setAppearancePreferences(appearance);
          }
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
        setError("Ayarlar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSecurityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSecurityForm(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationToggle = (setting: string) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev],
    }));
  };

  const handleAppearanceChange = (setting: string, value: string | boolean) => {
    setAppearancePreferences(prev => ({
      ...prev,
      [setting]: value,
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    
    try {
      // Handle password change if new password is provided
      if (activeTab === "security" && securityForm.newPassword) {
        if (securityForm.newPassword !== securityForm.confirmPassword) {
          toast.error("Yeni şifreler eşleşmiyor");
          return;
        }

        if (securityForm.newPassword.length < 8) {
          toast.error("Şifre en az 8 karakter uzunluğunda olmalıdır");
          return;
        }

        const passwordResponse = await fetch('/api/auth/password', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            currentPassword: securityForm.currentPassword,
            newPassword: securityForm.newPassword
          })
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(errorData.error || 'Şifre güncellenirken bir hata oluştu');
        }

        // Clear password form
        setSecurityForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });

        toast.success("Şifreniz başarıyla güncellendi");
      }

      // Update other settings based on active tab
      if (activeTab === "profile") {
        const response = await fetch('/api/tutor/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...profileForm
          })
        });

        if (!response.ok) {
          throw new Error('Profil güncellenirken bir hata oluştu');
        }
        
        toast.success("Profil bilgileriniz başarıyla güncellendi");
      } else if (activeTab === "notifications" || activeTab === "appearance") {
        const response = await fetch('/api/tutor/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            preferences: {
              notifications: notificationPreferences,
              appearance: appearancePreferences
            }
          })
        });

        if (!response.ok) {
          throw new Error('Tercihler güncellenirken bir hata oluştu');
        }
        
        toast.success(
          activeTab === "notifications" 
            ? "Bildirim tercihleriniz başarıyla güncellendi"
            : "Görünüm tercihleriniz başarıyla güncellendi"
        );
      }
    } catch (error: any) {
      console.error('Settings update error:', error);
      toast.error(error.message || 'Ayarlar güncellenirken bir hata oluştu');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSettings />;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg shadow-sm">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="md:col-span-1">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === "profile" 
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <User className={`mr-3 h-5 w-5 ${activeTab === "profile" ? "text-indigo-500" : "text-gray-400"}`} />
                <span className="font-medium">Profil Bilgileri</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === "security" 
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <Lock className={`mr-3 h-5 w-5 ${activeTab === "security" ? "text-indigo-500" : "text-gray-400"}`} />
                <span className="font-medium">Güvenlik</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === "notifications" 
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <Bell className={`mr-3 h-5 w-5 ${activeTab === "notifications" ? "text-indigo-500" : "text-gray-400"}`} />
                <span className="font-medium">Bildirimler</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
            
            <button
              onClick={() => setActiveTab("appearance")}
              className={`w-full px-4 py-3 flex items-center justify-between ${
                activeTab === "appearance" 
                  ? "bg-indigo-50 text-indigo-700 border-l-4 border-indigo-500" 
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center">
                <Layout className={`mr-3 h-5 w-5 ${activeTab === "appearance" ? "text-indigo-500" : "text-gray-400"}`} />
                <span className="font-medium">Görünüm</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="md:col-span-3">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          {activeTab === "profile" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Profil Bilgileri</h2>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      Ad
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
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
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>
                

                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon Numarası
                  </label>
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label htmlFor="specialization" className="block text-sm font-medium text-gray-700 mb-1">
                    Uzmanlık Alanı
                  </label>
                  <input
                    type="text"
                    id="specialization"
                    name="specialization"
                    value={profileForm.specialization}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
                    Hakkımda
                  </label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "security" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Güvenlik Ayarları</h2>
              <div className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Mevcut Şifre
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={securityForm.currentPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={securityForm.newPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre (Tekrar)
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={securityForm.confirmPassword}
                    onChange={handleSecurityChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-md border border-yellow-100">
                  <p className="text-sm text-yellow-700">
                    Güvenli bir şifre en az 8 karakter uzunluğunda olmalı ve büyük harf, küçük harf, rakam ve özel karakter içermelidir.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "notifications" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Bildirim Ayarları</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-gray-700">E-posta Bildirimleri</h3>
                    <p className="text-sm text-gray-500">Önemli güncellemeler için e-posta alın</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.emailNotifications ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={notificationPreferences.emailNotifications}
                      onClick={() => handleNotificationToggle("emailNotifications")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.emailNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Anlık Bildirimler</h3>
                    <p className="text-sm text-gray-500">Uygulama içi anlık bildirimler</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.pushNotifications ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={notificationPreferences.pushNotifications}
                      onClick={() => handleNotificationToggle("pushNotifications")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.pushNotifications ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Etkinlik Hatırlatıcıları</h3>
                    <p className="text-sm text-gray-500">Yaklaşan etkinlikler için hatırlatıcılar</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.eventReminders ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={notificationPreferences.eventReminders}
                      onClick={() => handleNotificationToggle("eventReminders")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.eventReminders ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <h3 className="text-md font-medium text-gray-700">Öğrenci Güncellemeleri</h3>
                    <p className="text-sm text-gray-500">Öğrencilerinizle ilgili önemli güncellemeler</p>
                  </div>
                  <div className="flex items-center">
                    <button
                      type="button"
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        notificationPreferences.studentUpdates ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                      role="switch"
                      aria-checked={notificationPreferences.studentUpdates}
                      onClick={() => handleNotificationToggle("studentUpdates")}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          notificationPreferences.studentUpdates ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === "appearance" && (
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-6">Görünüm Ayarları</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tema</label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleAppearanceChange("theme", "light")}
                      className={`p-4 rounded-lg border ${
                        appearancePreferences.theme === "light"
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-16 bg-white rounded-md border border-gray-200 mb-2"></div>
                      <span className="text-sm font-medium text-gray-900">Açık</span>
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange("theme", "dark")}
                      className={`p-4 rounded-lg border ${
                        appearancePreferences.theme === "dark"
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-16 bg-gray-800 rounded-md border border-gray-700 mb-2"></div>
                      <span className="text-sm font-medium text-gray-900">Koyu</span>
                    </button>
                    
                    <button
                      onClick={() => handleAppearanceChange("theme", "system")}
                      className={`p-4 rounded-lg border ${
                        appearancePreferences.theme === "system"
                          ? "border-indigo-500 ring-2 ring-indigo-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="h-16 bg-gradient-to-r from-white to-gray-800 rounded-md border border-gray-200 mb-2"></div>
                      <span className="text-sm font-medium text-gray-900">Sistem</span>
                    </button>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-gray-700 mb-3">Görünüm Seçenekleri</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-700">Sıkıştırılmış Mod</span>
                        <p className="text-xs text-gray-500">Daha kompakt bir yerleşim için</p>
                      </div>
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          appearancePreferences.compactMode ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                        role="switch"
                        aria-checked={appearancePreferences.compactMode}
                        onClick={() => handleAppearanceChange("compactMode", !appearancePreferences.compactMode)}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            appearancePreferences.compactMode ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-700">Yüksek Kontrast</span>
                        <p className="text-xs text-gray-500">Daha yüksek kontrast için</p>
                      </div>
                      <button
                        type="button"
                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          appearancePreferences.highContrast ? "bg-indigo-600" : "bg-gray-200"
                        }`}
                        role="switch"
                        aria-checked={appearancePreferences.highContrast}
                        onClick={() => handleAppearanceChange("highContrast", !appearancePreferences.highContrast)}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            appearancePreferences.highContrast ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yazı Boyutu</label>
                  <div className="grid grid-cols-4 gap-4">
                    {["small", "medium", "large", "x-large"].map((size) => (
                      <button
                        key={size}
                        onClick={() => handleAppearanceChange("fontSize", size)}
                        className={`py-2 px-4 rounded-lg border ${
                          appearancePreferences.fontSize === size
                            ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300 text-gray-700"
                        }`}
                      >
                        {size === "small" && "Küçük"}
                        {size === "medium" && "Orta"}
                        {size === "large" && "Büyük"}
                        {size === "x-large" && "Çok Büyük"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6">
            <button
              type="button"
              disabled={saving}
              onClick={saveSettings}
              className={`px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg shadow-sm hover:shadow-md transition-all flex items-center ${
                saving ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {saving ? (
                <>
                  <span className="mr-2 h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin"></span>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2" />
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading state components
function SidebarSkeleton() {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <div className="space-y-1">
        {[...Array(4)].map((_, index) => (
          <div key={`nav-skeleton-${index}`} className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-5" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProfileFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, index) => (
          <div key={`field-skeleton-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-32 w-full" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function SecurityFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={`security-field-${index}`} className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function NotificationsFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <div key={`notification-pref-${index}`} className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-6 w-12" />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function AppearanceFormSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-36" />
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={`theme-${index}`} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div key={`appearance-pref-${index}`} className="flex items-center justify-between">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-56" />
              </div>
              <Skeleton className="h-6 w-12" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

function LoadingSettings() {
  return (
    <div className="space-y-8">
      <HeaderSkeleton />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1">
          <SidebarSkeleton />
        </div>
        <div className="md:col-span-3">
          <Card className="border-0 shadow-md">
            <div className="p-6">
              <ProfileFormSkeleton />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function TutorSettingsPage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial load
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <LoadingSettings />
      ) : (
        <div className="space-y-8">
          <SettingsHeader />
          <SettingsContent />
        </div>
      )}
    </div>
  );
} 