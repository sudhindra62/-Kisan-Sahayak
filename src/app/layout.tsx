import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';
import { MessageCircle, Sprout, LayoutDashboard, CloudSun } from 'lucide-react';

export const metadata: Metadata = {
  title: 'KisanSahayak',
  description: 'AI-powered assistance for farmers to find eligible government schemes.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FirebaseClientProvider>
          <div className="center-blend"></div>
          <div className="center-glow"></div>
          
          {/* Main Navigation */}
          <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 p-1.5 rounded-full shadow-2xl">
            <Link href="/" className="flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-white/5 transition-all text-sm font-medium text-white/80 hover:text-white">
                <LayoutDashboard className="h-4 w-4" />
                <span>Dashboard</span>
            </Link>
            <Link href="/crop-advisor" className="flex items-center gap-2 px-5 py-2.5 rounded-full hover:bg-white/5 transition-all text-sm font-medium text-white/80 hover:text-white">
                <CloudSun className="h-4 w-4" />
                <span>Crop Advisor</span>
            </Link>
          </nav>

          <Link href="/chatbot" className="chatbot-trigger" title="AI Assistant">
            <MessageCircle className="h-8 w-8" />
          </Link>
          
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
