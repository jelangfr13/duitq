import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import QueryProvider from '@/lib/query-provider';
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
