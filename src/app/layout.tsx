import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

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
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <FirebaseClientProvider>
          <div className="center-blend"></div>
          <div className="center-glow"></div>
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
