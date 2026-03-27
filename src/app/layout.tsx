import type {Metadata} from 'next';
import './globals.css';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { AppSidebar } from '@/components/AppSidebar';
import { SessionProvider } from 'next-auth/react';

export const metadata: Metadata = {
  title: 'FlagOps — Optimizely Feature Flag Governance',
  description: 'Enterprise feature flag governance dashboard for Optimizely',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
        {/* Prevent flash of wrong theme */}
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme')||'dark';if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();` }} />
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30">
        <SessionProvider>
          <ThemeProvider>
            <QueryProvider>
              <AppSidebar />
              <div className="pl-56 min-h-screen">
                {children}
              </div>
            </QueryProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
