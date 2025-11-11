"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        // No user, redirect to login
        router.push("/login");
      }
    }
  }, [loading, user, router]);

  // Show loading indicator while checking auth state
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
