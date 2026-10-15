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
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useDashboard } from '@/hooks/useDashboard';
import { useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { DonutChart } from '@/components/charts/DonutChart';
import { BarChart } from '@/components/charts/BarChart';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { ITransaction } from '@shared/types/transaction';

export default function DashboardPage() {
  const { user } = useAuth();
  const { hideBalance, toggleHideBalance, openEditTransaction, openQuickAdd } = useAppStore();
  const { deleteTransaction, isDeleting } = useTransactions();

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
    true;

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Selamat Datang
          </span>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">
            {user?.fullName || 'Pengguna DuitQ'}
          </h1>
        </div>

        {/* Tombol Privasi Sembunyikan Saldo */}
        <button
          type="button"
          onClick={toggleHideBalance}
          className="p-2 rounded-xl bg-white border border-slate-200/80 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-all shadow-xs"
          title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
        >
          {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>

      {/* Kartu Ringkasan Saldo Utama (DSH-01) */}
      <Card className="p-5 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl shadow-md shadow-blue-600/20 border-0">
        <div className="flex items-center justify-between text-blue-100 text-xs font-medium">
          <span>Total Saldo Gabungan</span>
          <span className="text-[10px] bg-blue-500/30 px-2 py-0.5 rounded-full border border-blue-400/20">
            IDR
          </span>
        </div>

        <div className="mt-2">
          <p className="text-2xl font-extrabold tracking-tight tabular-nums">
            {hideBalance
              ? '••••••••'
              : formatRupiah(dashboard?.summary?.totalBalance || 0)}
          </p>
        </div>

        {/* Ringkasan Arus Masuk vs Keluar Periode Ini */}
        <div className="mt-4 pt-4 border-t border-blue-500/30 grid grid-cols-2 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-300 shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200">Uang Masuk</p>
              <p className="font-bold text-white tabular-nums">
                {hideBalance
                  ? '••••'
                  : formatRupiah(dashboard?.summary?.totalIncome || 0)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-300 shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-blue-200">Uang Keluar</p>
              <p className="font-bold text-white tabular-nums">
                {hideBalance
                  ? '••••'
                  : formatRupiah(dashboard?.summary?.totalExpense || 0)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Filter Rentang Waktu (DSH-05) */}
      <div className="flex items-center justify-between gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setPeriod('this_month');
            setShowCustomPicker(false);
          }}
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            period === 'this_month'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
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
          className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
            period === 'last_month'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
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
          className={`flex-1 py-1.5 rounded-lg text-center transition-all flex items-center justify-center gap-1 ${
            period === 'custom'
              ? 'bg-white text-slate-900 shadow-xs font-bold'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Kustom</span>
        </button>
      </div>

      {/* Date Picker jika memilih Kustom */}
      {showCustomPicker && (
        <Card className="p-3 bg-white border border-slate-100 rounded-2xl space-y-2">
          <p className="text-[11px] font-semibold text-slate-600">Pilih Rentang Tanggal:</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-slate-400">Dari:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Sampai:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs p-1.5 border border-slate-200 rounded-lg bg-white"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Total Piutang Aktif (Uang di Luar) jika modul Piutang aktif (DSH-04, RCV-04) */}
      {isReceivablesEnabled && (
        <Link href="/receivables" className="block">
          <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs hover:border-blue-200 transition-all flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Piutang Belum Tertagih</p>
                <p className="text-base font-bold text-slate-900 tabular-nums">
                  {hideBalance
                    ? '••••••••'
                    : formatRupiah(dashboard?.summary?.totalActiveReceivables || 0)}
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Card>
        </Link>
      )}

      {/* Ringkasan Saldo Tiap Sumber Dana (DSH-04) */}
      <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sumber Dana Anda
            </h2>
          </div>
          <Link
            href="/wallets"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            Kelola <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {dashboard?.fundingSources && dashboard.fundingSources.length > 0 ? (
          <div className="space-y-2">
            {dashboard.fundingSources.map((fs) => (
              <div
                key={fs._id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100/80"
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: fs.color || '#2563EB' }}
                  />
                  <div>
                    <p className="text-xs font-bold text-slate-800">{fs.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{fs.type}</p>
                  </div>
                </div>
                <p className="text-xs font-bold text-slate-900 tabular-nums">
                  {hideBalance ? '••••••' : formatRupiah(fs.currentBalance)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400">Belum ada sumber dana aktif.</p>
            <Link
              href="/wallets"
              className="mt-2 inline-block text-xs font-bold text-blue-600 underline"
            >
              Tambah Sumber Dana
            </Link>
          </div>
        )}
      </Card>

      {/* Grafik 1: Distribusi Ruang Penyimpanan (DSH-02) */}
      <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-indigo-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Distribusi Ruang Penyimpanan
            </h2>
          </div>
          <Link
            href="/spaces"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
          >
            Pos Anggaran <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <DonutChart spaces={dashboard?.storageSpaces || []} />
      </Card>

      {/* Grafik 2: Perbandingan Arus Kas (DSH-03) */}
      <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Perbandingan Arus Kas
            </h2>
          </div>
        </div>

        <BarChart data={dashboard?.cashFlowTrend || []} />
      </Card>

      {/* Daftar Transaksi Terbaru (DSH-01, TRX-03) */}
      <div id="transaksi" className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Transaksi Terakhir
          </h2>
          <button
            type="button"
            onClick={() => openQuickAdd('EXPENSE')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700"
          >
            + Catat Baru
          </button>
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
                  className="p-3.5 bg-white border border-slate-100 rounded-2xl shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 text-emerald-600'
                          : isExpense
                          ? 'bg-rose-50 text-rose-600'
                          : isTransfer
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-indigo-50 text-indigo-600'
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
                      <p className="text-xs font-bold text-slate-900 truncate">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(tx.transactionDate)}
                        {tx.notes ? ` • ${tx.notes}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-xs font-extrabold tabular-nums ${
                        isIncome
                          ? 'text-emerald-600'
                          : isExpense
                          ? 'text-rose-600'
                          : 'text-slate-800'
                      }`}
                    >
                      {isIncome ? '+' : isExpense ? '-' : ''}
                      {formatRupiah(tx.amount)}
                    </p>

                    {/* Tombol Aksi Edit & Hapus (TRX-03) */}
                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      <button
                        type="button"
                        onClick={() => openEditTransaction(tx)}
                        className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Transaksi"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        disabled={isDeleting}
                        onClick={() => handleDelete(tx)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          <Card className="p-6 text-center bg-white border border-slate-100 rounded-2xl">
            <p className="text-xs text-slate-500">Belum ada riwayat transaksi.</p>
            <button
              type="button"
              onClick={() => openQuickAdd('EXPENSE')}
              className="mt-3 text-xs font-bold text-blue-600 underline"
            >
              Catat Pengeluaran Pertama
            </button>
          </Card>
        )}
      </div>
    </div>
  );
}
