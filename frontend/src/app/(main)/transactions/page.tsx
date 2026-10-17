'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  X,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Layers,
  HandCoins,
  Calendar,
  Wallet,
  Clock,
  ChevronDown,
  Edit2,
  Trash2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  FileText,
  PieChart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions, useTransactionHistory } from '@/hooks/useTransactions';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useBudgets } from '@/hooks/useBudgets';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Select, SelectOption } from '@/components/ui/Select';
import { TransactionsSkeleton } from '@/components/ui/Skeleton';
import { formatRupiah, formatDateTime, formatDate } from '@/lib/format';
import { ITransaction, TransactionType } from '@shared/types/transaction';

// Helper mengelompokkan transaksi per tanggal: "Hari Ini", "Kemarin", "Sabtu, 17 Okt 2026"
function getTransactionDateGroupLabel(dateInput: Date | string, todayDate: Date | null): string {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'Tanggal Tidak Valid';

  if (!todayDate) {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  }

  const today = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate());
  const txDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = today.getTime() - txDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Hari Ini';
  if (diffDays === 1) return 'Kemarin';

  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export default function TransactionsHistoryPage() {
  const { user } = useAuth();
  const { hideBalance, openEditTransaction, openQuickAdd } = useAppStore();
  const { deleteTransaction, isDeleting } = useTransactions();
  const { themeColor } = useTheme();

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedFundingSource, setSelectedFundingSource] = useState<string>('');
  const [selectedBudget, setSelectedBudget] = useState<string>('');
  const [period, setPeriod] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'CUSTOM'>('THIS_MONTH');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({});
  const [todayDate, setTodayDate] = useState<Date | null>(null);

  // Selected Transaction for Detail BottomSheet
  const [activeTx, setActiveTx] = useState<any | null>(null);

  // Ambil Sumber Dana & Budgeting untuk dropdown filter
  const { fundingSources } = useFundingSources();
  const { budgets } = useBudgets();

  // Inisialisasi tanggal saat client mounted agar aman untuk prerendering Next.js
  useEffect(() => {
    setTodayDate(new Date());
  }, []);

  // Hitung rentang tanggal saat period berubah di client
  useEffect(() => {
    if (period === 'THIS_MONTH') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      setDateRange({ startDate: start, endDate: end });
    } else if (period === 'LAST_MONTH') {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).toISOString();
      setDateRange({ startDate: start, endDate: end });
    } else if (period === 'CUSTOM' && customStart && customEnd) {
      setDateRange({ startDate: customStart, endDate: customEnd });
    } else {
      setDateRange({});
    }
  }, [period, customStart, customEnd]);

  // Query API parameters
  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
      limit: 100,
    };
    if (search.trim()) p.search = search.trim();
    if (selectedType !== 'ALL') p.type = selectedType;
    if (selectedFundingSource) p.fundingSourceId = selectedFundingSource;
    if (selectedBudget) p.budgetId = selectedBudget;
    if (dateRange.startDate) p.startDate = dateRange.startDate;
    if (dateRange.endDate) p.endDate = dateRange.endDate;
    return p;
  }, [search, selectedType, selectedFundingSource, selectedBudget, dateRange]);

  const { data, isLoading, isError, refetch } = useTransactionHistory(queryParams);

  const transactions = data?.transactions || [];
  const summary = data?.summary || { totalIncome: 0, totalExpense: 0, count: 0 };

  // Kelompokkan transaksi berdasarkan tanggal
  const groupedTransactions = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    for (const tx of transactions) {
      const label = getTransactionDateGroupLabel(tx.transactionDate, todayDate);
      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(tx);
    }
    return groups;
  }, [transactions, todayDate]);

  // Hapus transaksi
  const handleDelete = async (tx: any) => {
    if (
      confirm(
        `Yakin ingin menghapus transaksi "${tx.title}" senilai ${formatRupiah(tx.amount)}? Efek saldo pada Sumber Dana dan Budget akan dikembalikan secara otomatis.`
      )
    ) {
      await deleteTransaction(tx._id);
      setActiveTx(null);
    }
  };

  // Reset semua filter
  const handleResetFilters = () => {
    setSearch('');
    setSelectedType('ALL');
    setSelectedFundingSource('');
    setSelectedBudget('');
    setPeriod('THIS_MONTH');
    setCustomStart('');
    setCustomEnd('');
  };

  const isFilterActive =
    search.trim() !== '' ||
    selectedType !== 'ALL' ||
    selectedFundingSource !== '' ||
    selectedBudget !== '' ||
    period !== 'THIS_MONTH';

  // Opsi Dropdown Sumber Dana (Custom Select persis seperti Tambah Transaksi)
  const fundingSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Semua Dompet' },
    ...fundingSources.map((fs) => ({
      value: fs._id,
      label: fs.name,
      sublabel: hideBalance ? undefined : `Saldo: ${formatRupiah(fs.currentBalance)}`,
      color: fs.color,
    })),
  ], [fundingSources, hideBalance]);

  // Opsi Dropdown Pos Anggaran / Budget (Custom Select)
  const budgetSelectOptions: SelectOption[] = useMemo(() => [
    { value: '', label: 'Semua Budget' },
    ...budgets.map((b) => {
      const fsName =
        typeof b.fundingSourceId === 'object' && b.fundingSourceId
          ? b.fundingSourceId.name
          : b.fundingSource?.name || 'Dompet';
      const remaining = Math.max(0, b.amount - b.spentAmount);
      return {
        value: b._id,
        label: b.name,
        sublabel: hideBalance ? undefined : `${fsName} • Sisa ${formatRupiah(remaining)}`,
        color: b.color,
      };
    }),
  ], [budgets, hideBalance]);

  // Opsi Dropdown Periode (Custom Select)
  const periodSelectOptions: SelectOption[] = [
    { value: 'THIS_MONTH', label: 'Bulan Ini', sublabel: 'Bulan berjalan' },
    { value: 'LAST_MONTH', label: 'Bulan Lalu', sublabel: 'Bulan sebelumnya' },
    { value: 'ALL', label: 'Semua Waktu', sublabel: 'Seluruh riwayat' },
    { value: 'CUSTOM', label: 'Kustom Tanggal', sublabel: 'Rentang tanggal' },
  ];

  // Daftar opsi chip tipe transaksi
  const TYPE_CHIPS = [
    { id: 'ALL', label: 'Semua' },
    { id: 'INCOME', label: 'Uang Masuk' },
    { id: 'EXPENSE', label: 'Uang Keluar' },
    { id: 'TRANSFER', label: 'Pindah Dana' },
    { id: 'RECEIVABLE_OUT', label: 'Beri Piutang' },
    { id: 'RECEIVABLE_IN', label: 'Pelunasan Piutang' },
  ];

  // Skeleton loading awal saat data transaksi pertama kali dipanggil (setelah seluruh hook terpanggil)
  if (isLoading && !data) {
    return <TransactionsSkeleton />;
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Top Header */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Histori Transaksi
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Pencarian dan filter mendalam seluruh mutasi keuangan Anda.
          </p>
        </div>

        {isFilterActive && (
          <button
            type="button"
            onClick={handleResetFilters}
            className="flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari transaksi, toko, atau catatan..."
          className="w-full h-11 pl-10 pr-9 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Filter Chips (Tipe Transaksi) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TYPE_CHIPS.map((chip) => {
          const isSelected = selectedType === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setSelectedType(chip.id)}
              style={isSelected ? { backgroundColor: themeColor, borderColor: themeColor } : undefined}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                isSelected
                  ? 'text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      {/* Filter Baris Kedua: Panel Gulir dengan Dropdown Kustom Berlebar Sama dengan Panel Option */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
        {/* Dropdown Custom Sumber Dana */}
        <Select
          id="select-filter-funding"
          className="w-48 shrink-0"
          variant="pill"
          leadingIcon={<Wallet className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
          value={selectedFundingSource}
          onChange={setSelectedFundingSource}
          options={fundingSelectOptions}
          placeholder="Semua Dompet"
        />

        {/* Dropdown Custom Pos Anggaran (Budget) */}
        <Select
          id="select-filter-budget"
          className="w-48 shrink-0"
          variant="pill"
          leadingIcon={<PieChart className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
          value={selectedBudget}
          onChange={setSelectedBudget}
          options={budgetSelectOptions}
          placeholder="Semua Budget"
        />

        {/* Dropdown Custom Periode */}
        <Select
          id="select-filter-period"
          className="w-44 shrink-0"
          variant="pill"
          leadingIcon={<Calendar className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
          value={period}
          onChange={(val) => setPeriod(val as any)}
          options={periodSelectOptions}
          placeholder="Periode"
        />

        {/* Tombol Reset Filter jika ada filter aktif */}
        {(selectedFundingSource || selectedBudget || period !== 'THIS_MONTH' || selectedType !== 'ALL' || search.trim()) && (
          <button
            type="button"
            onClick={() => {
              setSelectedFundingSource('');
              setSelectedBudget('');
              setPeriod('THIS_MONTH');
              setSelectedType('ALL');
              setSearch('');
            }}
            className="shrink-0 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline px-2.5 py-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer whitespace-nowrap"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Date Picker jika memilih Kustom Tanggal */}
      {period === 'CUSTOM' && (
        <Card className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2 shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">Rentang Tanggal:</p>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Pilih tanggal awal & akhir</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block mb-1">Mulai:</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-slate-400 dark:text-slate-500 block mb-1">Sampai:</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>
      )}

      {/* Kartu Ringkasan Hasil Filter */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-[11px]">
            Ringkasan Filter Aktif
          </span>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            {summary.count} transaksi ditemukan
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
          {/* Total Uang Masuk */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Uang Masuk</p>
              <p className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums truncate">
                {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalIncome)}
              </p>
            </div>
          </div>

          {/* Total Uang Keluar */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Uang Keluar</p>
              <p className="text-xs font-extrabold text-rose-600 dark:text-rose-400 tabular-nums truncate">
                {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalExpense)}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Daftar Transaksi Terkelompok per Tanggal (Grouped by Date) */}
      <div className="space-y-4 pt-1">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                    <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                  <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                  <div className="h-2.5 w-14 bg-slate-200 dark:bg-slate-800 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          Object.entries(groupedTransactions).map(([dateLabel, txList]) => (
            <div key={dateLabel} className="space-y-2">
              {/* Header Tanggal */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  {dateLabel}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                  {txList.length} transaksi
                </span>
              </div>

              {/* List Transaksi */}
              <div className="space-y-2">
                {txList.map((tx) => {
                  const isIncome = tx.type === 'INCOME' || tx.type === 'RECEIVABLE_IN';
                  const isExpense = tx.type === 'EXPENSE' || tx.type === 'RECEIVABLE_OUT';
                  const isTransfer = tx.type === 'TRANSFER';
                  const isSpace = tx.type === 'SPACE_ALLOCATION';

                  const sourceName = tx.sourceFundingId?.name || (typeof tx.sourceFundingId === 'string' ? tx.sourceFundingId : null);
                  const destName = tx.destinationFundingId?.name || (typeof tx.destinationFundingId === 'string' ? tx.destinationFundingId : null);
                  const budgetName = tx.budgetId?.name || (typeof tx.budgetId === 'string' ? tx.budgetId : null);
                  const spaceName = tx.storageSpaceId?.name || (typeof tx.storageSpaceId === 'string' ? tx.storageSpaceId : null);

                  return (
                    <Card
                      key={tx._id}
                      onClick={() => setActiveTx(tx)}
                      className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Ikon Semantik */}
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

                        {/* Title, Waktu, & Badges */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {tx.title}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {/* Badges Sumber Dana / Ruang / Budget */}
                            {isTransfer && sourceName && destName ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold truncate">
                                {sourceName} → {destName}
                              </span>
                            ) : sourceName ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold truncate">
                                {sourceName}
                              </span>
                            ) : destName ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold truncate">
                                {destName}
                              </span>
                            ) : null}

                            {budgetName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold truncate">
                                🎯 {budgetName}
                              </span>
                            )}

                            {spaceName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold truncate">
                                📦 {spaceName}
                              </span>
                            )}

                            {tx.notes && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                • {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nominal Transaksi */}
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
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                          {new Date(tx.transactionDate).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center justify-center mx-auto">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tidak ada transaksi yang cocok
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau atur ulang filter Anda.
              </p>
            </div>
            {isFilterActive && (
              <button
                type="button"
                onClick={handleResetFilters}
                style={{ color: themeColor }}
                className="text-xs font-bold underline cursor-pointer"
              >
                Reset Semua Filter
              </button>
            )}
          </Card>
        )}
      </div>

      {/* Modal BottomSheet: Detail Transaksi Lengkap */}
      <BottomSheet
        isOpen={!!activeTx}
        onClose={() => setActiveTx(null)}
        title="Rincian Transaksi"
      >
        {activeTx && (
          <div className="space-y-4 pb-2">
            {/* Header Nominal & Tipe */}
            <div className="text-center py-2 border-b border-slate-100 dark:border-slate-800 space-y-1">
              <span
                className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                  activeTx.type === 'INCOME' || activeTx.type === 'RECEIVABLE_IN'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                    : activeTx.type === 'EXPENSE' || activeTx.type === 'RECEIVABLE_OUT'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                    : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'
                }`}
              >
                {activeTx.type === 'INCOME'
                  ? 'Uang Masuk'
                  : activeTx.type === 'EXPENSE'
                  ? 'Uang Keluar'
                  : activeTx.type === 'TRANSFER'
                  ? 'Pindah Dana'
                  : activeTx.type === 'SPACE_ALLOCATION'
                  ? 'Alokasi Ruang'
                  : activeTx.type === 'RECEIVABLE_OUT'
                  ? 'Pemberian Piutang'
                  : 'Pelunasan Piutang'}
              </span>

              <p
                className={`text-2xl font-extrabold tabular-nums tracking-tight ${
                  activeTx.type === 'INCOME' || activeTx.type === 'RECEIVABLE_IN'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : activeTx.type === 'EXPENSE' || activeTx.type === 'RECEIVABLE_OUT'
                    ? 'text-rose-600 dark:text-rose-400'
                    : 'text-slate-900 dark:text-slate-100'
                }`}
              >
                {hideBalance ? (
                  'Rp ••••••••'
                ) : (
                  <>
                    {activeTx.type === 'INCOME' || activeTx.type === 'RECEIVABLE_IN' ? '+' : ''}
                    {activeTx.type === 'EXPENSE' || activeTx.type === 'RECEIVABLE_OUT' ? '-' : ''}
                    {formatRupiah(activeTx.amount)}
                  </>
                )}
              </p>

              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 pt-1">
                {activeTx.title}
              </h3>
            </div>

            {/* List Detail Transaksi */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Tanggal & Waktu
                </span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateTime(activeTx.transactionDate)}
                </span>
              </div>

              {activeTx.sourceFundingId && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Sumber Dana Asal
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeTx.sourceFundingId?.name || activeTx.sourceFundingId}
                  </span>
                </div>
              )}

              {activeTx.destinationFundingId && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" /> Sumber Dana Tujuan
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeTx.destinationFundingId?.name || activeTx.destinationFundingId}
                  </span>
                </div>
              )}

              {activeTx.budgetId && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <PieChart className="w-3.5 h-3.5 text-indigo-500" /> Pos Anggaran / Budget
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeTx.budgetId?.name || activeTx.budgetId}
                  </span>
                </div>
              )}

              {activeTx.storageSpaceId && (
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5" /> Ruang Penyimpanan
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {activeTx.storageSpaceId?.name || activeTx.storageSpaceId}
                  </span>
                </div>
              )}

              {activeTx.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 dark:text-slate-500 block mb-1">Catatan Tambahan:</span>
                  <p className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeTx.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Aksi: Edit & Hapus */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const txToEdit = activeTx;
                  setActiveTx(null);
                  openEditTransaction(txToEdit);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Transaksi</span>
              </button>

              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDelete(activeTx)}
                className="py-2.5 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
