'use client';

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "../contexts/AuthContext";
import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
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
    </QueryClientProvider>
  );
} 