import type { Metadata } from "next";
import { Quicksand } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import Providers from "./components/Providers";

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "BilgeVerse",
  description: "Öğrenci takip ve puan yönetim sistemi",
  icons: {
    icon: '/favicon.ico',
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
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${quicksand.className} min-h-screen bg-background`}>
        <Providers>
          <main className="min-h-screen">
            {children}
          </main>
        </Providers>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
