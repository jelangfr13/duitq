'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Plus,
  HandCoins,
  History,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAppStore } from '@/lib/store';
import { QuickAddTransactionSheet } from '@/components/transactions/QuickAddTransactionSheet';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { openQuickAdd } = useAppStore();

  const isReceivablesEnabled = user?.preferences?.enableReceivablesModule ?? true;

  const isDashboardActive = pathname === '/dashboard';
  const isWalletsOrSpacesActive = pathname === '/wallets' || pathname === '/spaces';
  const isReceivablesActive = pathname === '/receivables';
  const isSettingsActive = pathname === '/settings';

  return (
    <div className="max-w-md mx-auto min-h-dvh bg-slate-50 relative pb-20 shadow-sm flex flex-col">
      {/* Konten Halaman */}
      <main className="flex-1 w-full pb-4">
        {children}
      </main>

      {/* Floating Quick Add Transaction Sheet Drawer */}
      <QuickAddTransactionSheet />

      {/* Bottom Navigation Bar (Bab 7.1) */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/95 backdrop-blur-md border-t border-slate-100 px-3 py-1.5 z-40 flex items-center justify-around shadow-xs"
      >
        {/* 1. Beranda */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isDashboardActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className={`w-5 h-5 ${isDashboardActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Beranda</span>
        </Link>

        {/* 2. Dompet & Ruang */}
        <Link
          href="/wallets"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isWalletsOrSpacesActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Wallet className={`w-5 h-5 ${isWalletsOrSpacesActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Dompet</span>
        </Link>

        {/* 3. Tombol [+] Catat Cepat (Floating Center Action Button) */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            onClick={() => openQuickAdd('EXPENSE')}
            className="w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-blue-600/35 border-4 border-slate-50 transition-all cursor-pointer"
            aria-label="Catat Transaksi Cepat"
          >
            <Plus className="w-6 h-6 stroke-[2.8]" />
          </button>
        </div>

        {/* 4. Piutang (Dinamis: jika aktif tampilkan /receivables, jika tidak tampilkan Riwayat) */}
        {isReceivablesEnabled ? (
          <Link
            href="/receivables"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              isReceivablesActive
                ? 'text-blue-600 font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <HandCoins className={`w-5 h-5 ${isReceivablesActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 tracking-tight">Piutang</span>
          </Link>
        ) : (
          <Link
            href="/dashboard#transaksi"
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
              pathname === '/dashboard'
                ? 'text-slate-600 font-semibold'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <History className="w-5 h-5 stroke-2" />
            <span className="text-[10px] mt-1 tracking-tight">Riwayat</span>
          </Link>
        )}

        {/* 5. Profil & Pengaturan */}
        <Link
          href="/settings"
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-colors ${
            isSettingsActive
              ? 'text-blue-600 font-semibold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Settings className={`w-5 h-5 ${isSettingsActive ? 'stroke-[2.4]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-1 tracking-tight">Profil</span>
        </Link>
      </nav>
    </div>
  );
}
