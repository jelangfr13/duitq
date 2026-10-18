import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import QueryProvider from '@/lib/query-provider';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DuitQ — Manajemen Keuangan Pribadi Minimalis',
  description:
    'Aplikasi web mobile manajemen keuangan pribadi yang menyatukan sumber dana, ruang penyimpanan, dan piutang dalam satu antarmuka minimalis.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakartaSans.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('duitq_dark_mode') === 'true') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
                var c = localStorage.getItem('duitq_theme_color');
                if (c) {
                  document.documentElement.style.setProperty('--app-primary', c);
                }
              } catch (e) {}

              // Disable pinch-to-zoom and double-tap zoom gestures on mobile
              if (typeof window !== 'undefined') {
                document.addEventListener('gesturestart', function(e) { e.preventDefault(); });
                document.addEventListener('gesturechange', function(e) { e.preventDefault(); });
                document.addEventListener('gestureend', function(e) { e.preventDefault(); });
              }
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-blue-100 selection:text-blue-900 transition-colors duration-150">
        <QueryProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
