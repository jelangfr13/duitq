'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  HandCoins,
  Edit2,
  Trash2,
  Calendar,
  Layers,
  PieChart,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import dynamic from 'next/dynamic';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Skeleton, DashboardSkeleton } from '@/components/ui/Skeleton';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { ITransaction } from '@shared/types/transaction';

// Lazy loading komponen grafik berat (Recharts) dengan skeleton fallback
const TotalAssetsOverview = dynamic(
  () => import('@/components/charts/TotalAssetsOverview').then((mod) => mod.TotalAssetsOverview),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl animate-pulse">
        <span className="text-xs text-slate-400 dark:text-slate-500">Memuat ikhtisar aset...</span>
      </div>
    ),
  }
);

const BarChart = dynamic(
  () => import('@/components/charts/BarChart').then((mod) => mod.BarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl animate-pulse">
        <span className="text-xs text-slate-400 dark:text-slate-500">Memuat grafik arus kas...</span>
      </div>
    ),
  }
);

export default function DashboardPage() {
  const { user } = useAuth();
  const { hideBalance, toggleHideBalance, openEditTransaction, openQuickAdd } = useAppStore();
  const { deleteTransaction, isDeleting } = useTransactions();
  const { themeColor } = useTheme();

  // Filter rentang waktu (DSH-05: Bulan Ini, Bulan Lalu, Kustom)
  const [period, setPeriod] = useState<'this_month' | 'last_month' | 'custom'>('this_month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCustomPicker, setShowCustomPicker] = useState(false);

  const queryParams =
    period === 'custom' && customStart && customEnd
      ? { startDate: customStart, endDate: customEnd, period: 'custom' }
      : { period };

  const { data: dashboard, isLoading, refetch } = useDashboard(queryParams);

  const handleDelete = async (tx: ITransaction) => {
    if (confirm(`Yakin ingin menghapus transaksi "${tx.title}" senilai ${formatRupiah(tx.amount)}? Efek saldo akan dibatalkan secara otomatis.`)) {
      await deleteTransaction(tx._id);
    }
  };

  const isReceivablesEnabled =
    dashboard?.preferences?.enableReceivablesModule ??
    user?.preferences?.enableReceivablesModule ??
    false;

  // Inisial nama untuk avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return 'DQ';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // Tampilkan Skeleton loading saat data awal dashboard masih diambil
  if (isLoading && !dashboard) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Top Header: Ucapan & Profil Avatar */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Selamat Datang
          </span>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {user?.fullName || 'Pengguna DuitQ'}
          </h1>
        </div>

        {/* Foto Profil / Avatar User mengarah ke /settings (Update v1.2) */}
        <Link
          href="/settings"
          className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform active:scale-95 cursor-pointer"
          title="Buka Pengaturan Akun"
          aria-label="Pengaturan Akun"
        >
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || 'User'}
              loading="lazy"
              className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-sm"
            />
          ) : (
            <div
              style={{ backgroundColor: themeColor }}
              className="w-11 h-11 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-sm border-2 border-white dark:border-slate-800 tracking-wide"
            >
              {getInitials(user?.fullName)}
            </div>
          )}
        </Link>
      </div>

      {/* Kartu Ringkasan Saldo Utama (Hero Balance Card - DSH-01, Update v1.2) */}
      <div
        style={{
          background: `linear-gradient(135deg, ${themeColor}, ${themeColor}dd)`,
        }}
        className="p-5 text-white rounded-2xl shadow-md border-0 transition-all duration-300 relative overflow-hidden"
      >
        <div className="flex items-center justify-between text-white/90 text-xs font-medium">
          <span>Total Saldo Gabungan</span>
          <span className="text-[10px] bg-white/20 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20 font-semibold tracking-wide">
            IDR
          </span>
        </div>

        {/* Baris Nominal Saldo & Tombol Mata Sejajar (Update v1.2) */}
        <div className="mt-2 flex items-center gap-3">
          <p className="text-2xl font-extrabold tracking-tight tabular-nums">
            {hideBalance
              ? 'Rp ••••••••'
              : formatRupiah(dashboard?.summary?.totalBalance || 0)}
          </p>
          <button
            type="button"
            onClick={toggleHideBalance}
            className="bg-white/15 hover:bg-white/25 active:scale-95 text-white p-1.5 rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0"
            title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
            aria-label={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Ringkasan Arus Masuk vs Keluar Periode Ini */}
        <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/25 flex items-center justify-center text-emerald-200 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/80">Uang Masuk</p>
              <p className="font-bold text-white tabular-nums">
                {hideBalance
                  ? 'Rp ••••••'
                  : formatRupiah(dashboard?.summary?.totalIncome || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/25 flex items-center justify-center text-rose-200 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-white/80">Uang Keluar</p>
              <p className="font-bold text-white tabular-nums">
                {hideBalance
                  ? 'Rp ••••••'
                  : formatRupiah(dashboard?.summary?.totalExpense || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Rentang Waktu (DSH-05) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl text-xs font-semibold border border-transparent dark:border-slate-800 transition-colors">
        <button
          type="button"
          onClick={() => {
            setPeriod('this_month');
            setShowCustomPicker(false);
          }}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            period === 'this_month'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Bulan Ini
        </button>
        <button
          type="button"
          onClick={() => {
            setPeriod('last_month');
            setShowCustomPicker(false);
          }}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
            period === 'last_month'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Bulan Lalu
        </button>
        <button
          type="button"
          onClick={() => {
            setPeriod('custom');
            setShowCustomPicker(true);
          }}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 cursor-pointer ${
            period === 'custom'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Kustom</span>
        </button>
      </div>

      {/* Date Picker jika memilih Kustom */}
      {showCustomPicker && (
        <Card className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2">
          <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Pilih Rentang Tanggal:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500">Dari:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 dark:text-slate-500">Sampai:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Total Piutang Aktif (Uang di Luar) jika modul Piutang aktif (DSH-04, RCV-04) */}
      {isReceivablesEnabled && (
        <Link href="/receivables" className="block">
          <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs hover:border-blue-200 dark:hover:border-blue-900/40 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Piutang Belum Tertagih</p>
                <p className="text-base font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {hideBalance
                    ? 'Rp ••••••••'
                    : formatRupiah(dashboard?.summary?.totalActiveReceivables || 0)}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </Card>
        </Link>
      )}

      {/* Ringkasan Saldo Tiap Sumber Dana (DSH-04) */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4" style={{ color: themeColor }} />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Sumber Dana Anda
            </h2>
          </div>
          <Link
            href="/wallets"
            style={{ color: themeColor }}
            className="text-xs font-semibold hover:underline flex items-center gap-0.5"
          >
            Kelola <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dashboard?.fundingSources && dashboard.fundingSources.length > 0 ? (
          <div className="space-y-2">
            {dashboard.fundingSources.map((fs) => (
              <div
                key={fs._id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100/80 dark:border-slate-700/60"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: fs.color || themeColor }}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{fs.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">{fs.type}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                  {hideBalance ? 'Rp ••••••' : formatRupiah(fs.currentBalance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400 dark:text-slate-500">Belum ada sumber dana aktif.</p>
            <Link
              href="/wallets"
              style={{ color: themeColor }}
              className="mt-2 inline-block text-xs font-bold underline"
            >
              Tambah Sumber Dana
            </Link>
          </div>
        )}
      </Card>

      {/* Fitur: Total Keseluruhan Aset & Ikhtisar Finansial Lengkap */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <TotalAssetsOverview
          summary={dashboard?.summary}
          fundingSources={dashboard?.fundingSources || []}
          budgets={dashboard?.budgets || []}
          isReceivablesEnabled={isReceivablesEnabled}
          hideBalance={hideBalance}
          themeColor={themeColor}
        />
      </Card>

      {/* Grafik 2: Perbandingan Arus Kas (DSH-03) */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Perbandingan Arus Kas
            </h2>
          </div>
        </div>

        <BarChart data={dashboard?.cashFlowTrend || []} />
      </Card>

      {/* Daftar Transaksi Terbaru (DSH-01, TRX-03, Update v1.2) */}
      <div id="transaksi" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Transaksi Terakhir
          </h2>
          <div className="flex items-center gap-3">
            <Link
              href="/transactions"
              style={{ color: themeColor }}
              className="text-xs font-semibold hover:underline flex items-center gap-1"
            >
              Lihat Semua
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {dashboard?.recentTransactions && dashboard.recentTransactions.length > 0 ? (
          <div className="space-y-2">
            {dashboard.recentTransactions.map((tx) => {
              const isIncome = tx.type === 'INCOME' || tx.type === 'RECEIVABLE_IN';
              const isExpense = tx.type === 'EXPENSE' || tx.type === 'RECEIVABLE_OUT';
              const isTransfer = tx.type === 'TRANSFER';
              const isSpace = tx.type === 'SPACE_ALLOCATION';

              return (
                <Card
                  key={tx._id}
                  className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          : isTransfer
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                          : 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                      ) : isExpense ? (
                        <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                      ) : isTransfer ? (
                        <ArrowLeftRight className="w-4 h-4 stroke-[2.2]" />
                      ) : (
                        <Layers className="w-4 h-4 stroke-[2.2]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        {formatDateTime(tx.transactionDate)}
                        {tx.notes ? ` • ${tx.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-extrabold tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {hideBalance ? (
                        'Rp ••••••'
                      ) : (
                        <>
                          {isIncome ? '+' : isExpense ? '-' : ''}
                          {formatRupiah(tx.amount)}
                        </>
                      )}
                    </p>

                    {/* Tombol Aksi Edit & Hapus (TRX-03) */}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => openEditTransaction(tx)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(tx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada riwayat transaksi.</p>
            <button
              type="button"
              onClick={() => openQuickAdd('EXPENSE')}
              style={{ color: themeColor }}
              className="mt-3 text-xs font-bold underline cursor-pointer"
            >
              Catat Pengeluaran Pertama
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
