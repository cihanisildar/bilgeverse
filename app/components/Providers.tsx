'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider
      // Disable automatic refetching on window focus
      refetchOnWindowFocus={false}
      // Disable automatic refetching on reconnect
      refetchWhenOffline={false}
      // Set refetch interval to 5 minutes instead of default 1 minute
      refetchInterval={5 * 60}
    >
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
} 