import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import Providers from "./components/Providers";
import ServiceWorkerManager from "./components/ServiceWorkerManager";

// Optimize font loading for better LCP
const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600"],  // Reduced font weights for better performance
  variable: "--font-quicksand",
  display: "swap",  // Improve font loading performance
  preload: true,
});

export const metadata: Metadata = {
  title: "BilgeVerse",
  description: "Öğrenci takip ve puan yönetim sistemi",
  icons: {
    icon: "/favicon.ico",
  },
  // Add performance and SEO optimizations
  generator: "Next.js",
  applicationName: "BilgeVerse",
  keywords: ["öğrenci", "takip", "puan", "yönetim", "eğitim"],
  authors: [{ name: "BilgeVerse Team" }],
  creator: "BilgeVerse",
  publisher: "BilgeVerse",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <link rel="icon" href="/favicon.ico" />
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* DNS prefetch for external image domains */}
        <link rel="dns-prefetch" href="//images.unsplash.com" />
        <link rel="dns-prefetch" href="//cdn.dsmcdn.com" />
      </head>
      <body className={`${quicksand.className} min-h-screen bg-background antialiased`}>
        <ServiceWorkerManager />
        <Providers>
          <main className="min-h-screen">{children}</main>
        </Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  );
}
