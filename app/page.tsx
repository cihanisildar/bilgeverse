"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { user, loading, isAdmin, isTutor, isStudent } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect based on role
        if (isAdmin) {
          router.push("/admin");
        } else if (isTutor) {
          router.push("/tutor");
        } else if (isStudent) {
          router.push("/student");
        }
      } else {
        // No user, redirect to login
        router.push("/login");
      }
    }
  }, [loading, user, isAdmin, isTutor, isStudent, router]);

  // Show loading indicator while checking auth state
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold mb-4">Yaygın Eğitim Sistemi</div>
        <div className="w-full flex items-center justify-center">
          <div className="loader"></div>
        </div>
      </div>
    </div>
  );
}
