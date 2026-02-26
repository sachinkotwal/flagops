import type {Metadata} from 'next';
import './globals.css';

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
      </head>
      <body className="font-body antialiased bg-background text-foreground selection:bg-primary/30">
        {children}
      </body>
    </html>
  );
}
