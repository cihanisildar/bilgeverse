"use client";

import PointsUpdateDialog from "@/app/components/PointsUpdateDialog";
import { Button } from "@/components/ui/button";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type User = {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  points: number;
  tutorId?: string;
  createdAt: string;
};

type Tutor = {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
};

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    role: "",
    firstName: "",
    lastName: "",
    tutorId: "",
    points: 0,
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({
    username: "",
    email: "",
    role: "",
    tutorId: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}`);

        if (!response.ok) {
          throw new Error("Kullanıcı bilgileri alınamadı");
        }

        const data = await response.json();
        setUser(data.user);
        setFormData({
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          tutorId: data.user.tutorId || "",
          points: data.user.points || 0,
          password: "",
          confirmPassword: "",
        });
      } catch (err) {
        console.error("Kullanıcı bilgilerini alırken hata:", err);
        setError(
          "Kullanıcı bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin."
        );
      } finally {
        setLoading(false);
      }
    };

    const fetchTutors = async () => {
      try {
        const response = await fetch("/api/users?role=tutor");

        if (!response.ok) {
          throw new Error("Öğretmenler alınamadı");
        }

        const data = await response.json();
        setTutors(
          data.users.map((tutor: any) => ({
            id: tutor.id,
            username: tutor.username,
            firstName: tutor.firstName,
            lastName: tutor.lastName,
          }))
        );
      } catch (err) {
        console.error("Öğretmenleri alırken hata:", err);
      }
    };

    if (userId) {
      fetchUser();
      fetchTutors();
    }
  }, [userId]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Handle numeric value for points
    if (name === "points") {
      setFormData((prev) => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when field is edited
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {
      username: "",
      email: "",
      role: "",
      tutorId: "",
      password: "",
      confirmPassword: "",
    };

    let isValid = true;

    if (!formData.username.trim()) {
      errors.username = "Kullanıcı adı gereklidir";
      isValid = false;
    }

    if (!formData.email.trim()) {
      errors.email = "E-posta adresi gereklidir";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Geçerli bir e-posta adresi giriniz";
      isValid = false;
    }

    if (!formData.role) {
      errors.role = "Kullanıcı rolü gereklidir";
      isValid = false;
    }

    if (formData.role === UserRole.STUDENT && !formData.tutorId) {
      errors.tutorId = "Öğrenci için öğretmen atanması gereklidir";
      isValid = false;
    }

    // Only validate password fields if either one is filled
    if (formData.password || formData.confirmPassword) {
      if (!formData.password) {
        errors.password = "Şifre gereklidir";
        isValid = false;
      } else if (formData.password.length < 6) {
        errors.password = "Şifre en az 6 karakter olmalıdır";
        isValid = false;
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = "Şifreler eşleşmiyor";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      // Update user info
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          role: formData.role,
          firstName: formData.firstName || undefined,
          lastName: formData.lastName || undefined,
          tutorId:
            formData.role === UserRole.STUDENT ? formData.tutorId : undefined,
          points: formData.points,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Kullanıcı güncellenirken bir hata oluştu"
        );
      }

      // Update password if provided
      if (formData.password) {
        const passwordResponse = await fetch(`/api/users/${userId}/password`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            password: formData.password,
          }),
        });

        if (!passwordResponse.ok) {
          const errorData = await passwordResponse.json();
          throw new Error(
            errorData.error || "Şifre güncellenirken bir hata oluştu"
          );
        }
      }

      toast.success("Kullanıcı başarıyla güncellendi");

      // Navigate back to users list
      router.push("/admin/users");
      router.refresh();
    } catch (err: any) {
      console.error("Kullanıcı güncelleme hatası:", err);
      setError(err.message || "Kullanıcı güncellenirken bir hata oluştu");
      toast.error(err.message || "Kullanıcı güncellenirken bir hata oluştu");
    } finally {
      setSaving(false);
    }
  };

  const getTutorDisplayName = (tutorId: string) => {
    const tutor = tutors.find((t) => t.id === tutorId);
    if (!tutor) return "";

    if (tutor.firstName && tutor.lastName) {
      return `${tutor.firstName} ${tutor.lastName}`;
    }

    return tutor.username;
  };

  // Add a function to handle points update
  const handlePointsUpdated = (newPoints: number) => {
    setUser((prev) => (prev ? { ...prev, points: newPoints } : null));
    setFormData((prev) => ({ ...prev, points: newPoints }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <span className="ml-3 text-gray-600">Yükleniyor...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
        Kullanıcı bulunamadı
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-8 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Kullanıcı Düzenle
        </h1>
        <Link
          href="/admin/users"
          className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 transition-colors duration-150 py-2 px-4 rounded-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Kullanıcılara Dön
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Kullanıcı Adı
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  formErrors.username
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all`}
              />
              {formErrors.username && (
                <p className="text-sm text-red-600">{formErrors.username}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-posta
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  formErrors.email
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all`}
              />
              {formErrors.email && (
                <p className="text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="block text-sm font-medium text-gray-700"
              >
                Ad
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="block text-sm font-medium text-gray-700"
              >
                Soyad
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all"
              />
            </div>

            {/* Role */}
            <div className="space-y-2">
              <label
                htmlFor="role"
                className="block text-sm font-medium text-gray-700"
              >
                Rol
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  formErrors.role
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all appearance-none bg-white`}
              >
                <option value="">Rol Seçin</option>
                <option value={UserRole.ADMIN}>Yönetici</option>
                <option value={UserRole.TUTOR}>Öğretmen</option>
                <option value={UserRole.STUDENT}>Öğrenci</option>
              </select>
              {formErrors.role && (
                <p className="text-sm text-red-600">{formErrors.role}</p>
              )}
            </div>

            {/* Tutor (only for students) */}
            {formData.role === UserRole.STUDENT && (
              <div className="space-y-2">
                <label
                  htmlFor="tutorId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Öğretmen
                </label>
                <select
                  id="tutorId"
                  name="tutorId"
                  value={formData.tutorId}
                  onChange={handleChange}
                  className={`mt-1 block w-full border ${
                    formErrors.tutorId
                      ? "border-red-300 ring-1 ring-red-300"
                      : "border-gray-300"
                  } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all appearance-none bg-white`}
                >
                  <option value="">Öğretmen Seçin</option>
                  {tutors.map((tutor) => (
                    <option key={tutor.id} value={tutor.id}>
                      {tutor.firstName && tutor.lastName
                        ? `${tutor.firstName} ${tutor.lastName}`
                        : tutor.username}
                    </option>
                  ))}
                </select>
                {formErrors.tutorId && (
                  <p className="text-sm text-red-600">{formErrors.tutorId}</p>
                )}
              </div>
            )}

            {/* Password */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Yeni Şifre
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  formErrors.password
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all`}
                placeholder="Boş bırakırsanız şifre değişmez"
              />
              {formErrors.password && (
                <p className="text-sm text-red-600">{formErrors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Yeni Şifre Tekrar
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`mt-1 block w-full border ${
                  formErrors.confirmPassword
                    ? "border-red-300 ring-1 ring-red-300"
                    : "border-gray-300"
                } rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all`}
                placeholder="Boş bırakırsanız şifre değişmez"
              />
              {formErrors.confirmPassword && (
                <p className="text-sm text-red-600">{formErrors.confirmPassword}</p>
              )}
            </div>
          </div>

          {/* User info */}
          <div className="border-t border-gray-200 pt-6 mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Kullanıcı Bilgileri
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500 flex items-center justify-between">
                  <span>Puan</span>
                  <PointsUpdateDialog
                    userId={userId}
                    currentPoints={user.points}
                    onPointsUpdated={handlePointsUpdated}
                    triggerComponent={
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs py-1 h-7 bg-white hover:bg-indigo-50 text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:border-indigo-300 transition-all font-medium"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3.5 w-3.5 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Güncelle
                      </Button>
                    }
                  />
                </dt>
                <dd className="mt-2 text-2xl font-semibold text-gray-900">
                  {user.points}
                </dd>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <dt className="text-sm font-medium text-gray-500">
                  Kayıt Tarihi
                </dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                </dd>
              </div>
              {user.role === UserRole.STUDENT && user.tutorId && (
                <div className="bg-gray-50 rounded-lg p-4 sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">
                    Mevcut Öğretmen
                  </dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {getTutorDisplayName(user.tutorId) || "Atanmamış"}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="bg-indigo-600 text-white py-2.5 px-6 border border-transparent rounded-lg shadow-sm text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors flex items-center gap-2"
              disabled={saving}
            >
              {saving ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Değişiklikleri Kaydet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
