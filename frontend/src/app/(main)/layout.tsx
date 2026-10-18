'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Plus,
  ReceiptText,
  HandCoins,
  Settings,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/theme/ThemeProvider';

// Lazy load BottomSheet formulir transaksi
const QuickAddTransactionSheet = dynamic(
  () =>
    import('@/components/transactions/QuickAddTransactionSheet').then(
      (mod) => mod.QuickAddTransactionSheet
    ),
  { ssr: false }
);

function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openQuickAdd } = useAppStore();
  const { themeColor } = useTheme();

  const isReceivablesEnabled = user?.preferences?.enableReceivablesModule ?? false;

  const isDashboardActive = pathname === '/dashboard';
  const isWalletsOrSpacesActive =
    pathname.startsWith('/wallets') || pathname === '/budgets' || pathname === '/spaces';
  const isTransactionsActive = pathname === '/transactions';
  const isReceivablesActive = pathname === '/receivables';
  const isSettingsActive = pathname === '/settings';

  return (
    <nav
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 px-2 py-1.5 z-40 flex items-center justify-around shadow-xs transition-colors duration-150"
    >
      {/* 1. Beranda */}
      <Link
        href="/dashboard"
        style={isDashboardActive ? { color: themeColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isDashboardActive
            ? 'font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Beranda</span>
      </Link>

      {/* 2. Dompet & Ruang */}
      <Link
        href="/wallets"
        style={isWalletsOrSpacesActive ? { color: themeColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isWalletsOrSpacesActive
            ? 'font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Wallet className={`w-5 h-5 ${isWalletsOrSpacesActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Dompet</span>
      </Link>

      {/* 3. Tombol [+] Catat Cepat (Floating Center Action Button) */}
      <div className="flex-1 flex justify-center -mt-5">
        <button
          type="button"
          onClick={() => openQuickAdd('EXPENSE')}
          style={{ backgroundColor: themeColor }}
          className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg active:scale-95 border-4 border-slate-50 dark:border-slate-950 transition-all cursor-pointer"
          aria-label="Catat Transaksi Cepat"
        >
          <Plus className="w-6 h-6 stroke-[2.8]" />
        </button>
      </div>

      {/* 4. Histori Transaksi (Selalu Tersedia) */}
      <Link
        href="/transactions"
        style={isTransactionsActive ? { color: themeColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isTransactionsActive
            ? 'font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <ReceiptText className={`w-5 h-5 ${isTransactionsActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Histori</span>
      </Link>

      {/* 5. Piutang (Jika Fitur Piutang Diaktifkan) */}
      {isReceivablesEnabled && (
        <Link
          href="/receivables"
          style={isReceivablesActive ? { color: themeColor } : undefined}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isReceivablesActive
              ? 'font-semibold'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
          }`}
        >
          <HandCoins className={`w-5 h-5 ${isReceivablesActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Piutang</span>
        </Link>
      )}

      {/* 6. Pengaturan / Profil */}
      <Link
        href="/settings"
        style={isSettingsActive ? { color: themeColor } : undefined}
        className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
          isSettingsActive
            ? 'font-semibold'
            : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
        }`}
      >
        <Settings className={`w-5 h-5 ${isSettingsActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Profil</span>
      </Link>
    </nav>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-md mx-auto min-h-dvh bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative pb-20 shadow-sm flex flex-col transition-colors duration-150 overflow-x-hidden w-full">
      {/* Konten Halaman */}
      <main className="flex-1 w-full pb-4 overflow-x-hidden">
        {children}
      </main>

      {/* Floating Quick Add Transaction Sheet Drawer */}
      <QuickAddTransactionSheet />

      {/* Bottom Navigation Bar di dalam Suspense untuk Next.js Prerendering */}
      <React.Suspense fallback={null}>
        <BottomNav />
      </React.Suspense>
    </div>
  );
}

