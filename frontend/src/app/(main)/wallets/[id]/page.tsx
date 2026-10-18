'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Wallet,
  Landmark,
  Smartphone,
  Banknote,
  Search,
  X,
  History,
  Eye,
  EyeOff,
  Clock,
  Layers,
  PieChart,
  Trash2,
  Plus,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useTransactionHistory, useTransactions } from '@/hooks/useTransactions';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { FundingSourceType } from '@shared/types/funding-source';

// Helper mengelompokkan mutasi per tanggal: "Hari Ini", "Kemarin", "Sabtu, 17 Okt 2026"
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

function WalletDetailPageSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4 animate-pulse">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-1.5">
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
        </div>
      </div>
      <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
    </div>
  );
}

function WalletDetailContent() {
  const params = useParams<{ id: string }>();
  const walletId = params?.id as string;
  const router = useRouter();

  const { hideBalance, toggleHideBalance, openQuickAdd } = useAppStore();
  const { deleteTransaction } = useTransactions();
  const { themeColor } = useTheme();

  // Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INCOME' | 'EXPENSE' | 'TRANSFER'>('ALL');
  const [todayDate, setTodayDate] = useState<Date | null>(null);

  // Detail Modal Transaksi
  const [activeTx, setActiveTx] = useState<any | null>(null);

  // Ambil Sumber Dana & Temukan Wallet Terpilih
  const { fundingSources, isLoading: isLoadingWallets } = useFundingSources();
  const wallet = fundingSources.find((fs) => fs._id === walletId);

  // Inisialisasi tanggal client
  useEffect(() => {
    setTodayDate(new Date());
  }, []);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Query API parameters khusus untuk Sumber Dana ini
  const queryParams = useMemo(() => {
    const p: Record<string, any> = {
      fundingSourceId: walletId,
      limit: 100,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (filterType !== 'ALL') p.type = filterType;
    return p;
  }, [walletId, debouncedSearch, filterType]);

  const {
    data: txData,
    isLoading: isLoadingTx,
    isFetching,
  } = useTransactionHistory(queryParams, { enabled: !!walletId });

  const transactions = txData?.transactions || [];

  // Hitung total Uang Masuk & Keluar spesifik untuk wallet ini dari seluruh transaksi yang terambil
  const walletStats = useMemo(() => {
    let inflow = 0;
    let outflow = 0;
    for (const tx of transactions as any[]) {
      const isIncoming =
        tx.type === 'INCOME' ||
        tx.type === 'RECEIVABLE_IN' ||
        (tx.type === 'TRANSFER' &&
          ((tx.destinationFundingId as any)?._id === walletId ||
            tx.destinationFundingId === walletId));
      if (isIncoming) {
        inflow += tx.amount;
      } else {
        outflow += tx.amount;
      }
    }
    return { inflow, outflow };
  }, [transactions, walletId]);

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
  const handleDeleteTx = async (tx: any) => {
    if (
      confirm(
        `Yakin ingin menghapus transaksi "${tx.title}" senilai ${formatRupiah(tx.amount)}? Efek saldo pada rekening ini akan dikembalikan secara otomatis.`
      )
    ) {
      await deleteTransaction(tx._id);
      setActiveTx(null);
    }
  };

  const renderWalletIcon = (type: FundingSourceType) => {
    switch (type) {
      case 'BANK':
        return <Landmark className="w-5 h-5" />;
      case 'EWALLET':
        return <Smartphone className="w-5 h-5" />;
      case 'CASH':
        return <Banknote className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  // State Loading Halaman
  if (isLoadingWallets && !wallet) {
    return (
      <div className="space-y-4 px-4 pt-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
          </div>
        </div>
        <div className="h-40 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // State Jika Wallet Tidak Ditemukan
  if (!isLoadingWallets && !wallet) {
    return (
      <div className="px-4 pt-8 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center mx-auto">
          <AlertCircle className="w-7 h-7 stroke-[2]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Sumber Dana Tidak Ditemukan
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rekening atau dompet yang Anda cari mungkin telah dihapus.
          </p>
        </div>
        <Button onClick={() => router.push('/wallets')} size="sm">
          Kembali ke Daftar Sumber Dana
        </Button>
      </div>
    );
  }

  const FILTER_CHIPS = [
    { id: 'ALL', label: 'Semua' },
    { id: 'INCOME', label: 'Uang Masuk' },
    { id: 'EXPENSE', label: 'Uang Keluar' },
    { id: 'TRANSFER', label: 'Pindah Dana' },
  ];

  return (
    <div className="space-y-4 px-4 pt-3 pb-8">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Link
            href="/wallets"
            className="p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Kembali ke Sumber Dana"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
              <span>Mutasi Rekening</span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {wallet?.name} • {wallet?.type}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => openQuickAdd()}
          style={{ backgroundColor: themeColor }}
          className="text-xs font-semibold text-white px-3 py-1.5 rounded-xl shadow-xs hover:opacity-90 flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Transaksi</span>
        </button>
      </div>

      {/* Hero Card: Detail Rekening & Saldo Terkini */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 relative overflow-hidden">
        {/* Color Accent Strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1.5"
          style={{ backgroundColor: wallet?.color || '#2563EB' }}
        />

        <div className="flex items-start justify-between pl-1">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
              style={{ backgroundColor: wallet?.color || '#2563EB' }}
            >
              {wallet && renderWalletIcon(wallet.type)}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {wallet?.name}
              </h2>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                {wallet?.type}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleHideBalance}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={hideBalance ? 'Tampilkan Saldo' : 'Sembunyikan Saldo'}
          >
            {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Saldo Terkini */}
        <div className="pl-1 pt-1 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Saldo Terkini</p>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums tracking-tight">
            {hideBalance ? '••••••••' : formatRupiah(wallet?.currentBalance || 0)}
          </p>
        </div>

        {/* Ringkasan Arus Mutasi Khusus Rekening Ini */}
        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950/70 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Uang Masuk</p>
            <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {hideBalance ? '••••••' : `+${formatRupiah(walletStats.inflow)}`}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Total Uang Keluar</p>
            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {hideBalance ? '••••••' : `-${formatRupiah(walletStats.outflow)}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Search Input Bar (Khusus Rekening Ini) */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Cari mutasi di ${wallet?.name}...`}
          className="w-full h-11 pl-10 pr-12 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
        />
        <div className="absolute right-3 flex items-center gap-1.5">
          {isFetching && (
            <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDebouncedSearch('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips Tipe Transaksi */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {FILTER_CHIPS.map((chip) => {
          const isSelected = filterType === chip.id;
          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilterType(chip.id as any)}
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

      {/* Daftar Riwayat Mutasi Kronologis */}
      <div className="space-y-4 pt-1">
        {isLoadingTx ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="space-y-1.5 flex flex-col items-end">
                  <div className="h-3.5 w-20 bg-slate-200 dark:bg-slate-800 rounded" />
                  <div className="h-2.5 w-12 bg-slate-200 dark:bg-slate-800 rounded" />
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
                  {txList.length} mutasi
                </span>
              </div>

              {/* List Kartu Mutasi */}
              <div className="space-y-2">
                {txList.map((tx) => {
                  const isIncoming =
                    tx.type === 'INCOME' ||
                    tx.type === 'RECEIVABLE_IN' ||
                    (tx.type === 'TRANSFER' &&
                      ((tx.destinationFundingId as any)?._id === walletId ||
                        tx.destinationFundingId === walletId));

                  const isTransfer = tx.type === 'TRANSFER';
                  const destWalletName = tx.destinationFundingId?.name;
                  const srcWalletName = tx.sourceFundingId?.name;
                  const budgetName = tx.budgetId?.name;

                  return (
                    <Card
                      key={tx._id}
                      onClick={() => setActiveTx(tx)}
                      className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs flex items-center justify-between gap-3 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Ikon Arah Aliran Dana */}
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isIncoming
                              ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                              : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isIncoming ? (
                            <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                          ) : (
                            <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                          )}
                        </div>

                        {/* Title, Waktu, & Badges */}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {tx.title}
                          </p>

                          <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                            {/* Badge Transfer antar dompet */}
                            {isTransfer && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold truncate">
                                {isIncoming
                                  ? `Dari ${srcWalletName || 'Dompet'}`
                                  : `Ke ${destWalletName || 'Dompet'}`}
                              </span>
                            )}

                            {/* Badge Pos Anggaran / Budget */}
                            {budgetName && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-semibold truncate">
                                {budgetName}
                              </span>
                            )}

                            {/* Catatan Transaksi */}
                            {tx.notes && !isTransfer && !budgetName && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                {tx.notes}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Nominal & Waktu Transaksi */}
                      <div className="text-right shrink-0">
                        <p
                          className={`text-xs font-extrabold tabular-nums tracking-tight ${
                            isIncoming
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {hideBalance ? (
                            'Rp ••••••'
                          ) : (
                            <>
                              {isIncoming ? '+' : '-'}
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
              <History className="w-6 h-6 stroke-[1.8]" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Belum Ada Mutasi Transaksi
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {search || filterType !== 'ALL'
                  ? 'Tidak ada mutasi yang sesuai dengan filter atau kata kunci Anda.'
                  : `Transaksi yang menggunakan ${wallet?.name} akan otomatis tercatat di sini.`}
              </p>
            </div>
            {(search || filterType !== 'ALL') ? (
              <button
                type="button"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setFilterType('ALL');
                }}
                style={{ color: themeColor }}
                className="text-xs font-bold underline cursor-pointer"
              >
                Reset Filter
              </button>
            ) : (
              <Button
                size="sm"
                onClick={() => openQuickAdd()}
                className="text-xs mt-2"
              >
                + Catat Transaksi Baru
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Modal BottomSheet: Detail Transaksi Lengkap */}
      <BottomSheet
        isOpen={!!activeTx}
        onClose={() => setActiveTx(null)}
        title="Rincian Mutasi Transaksi"
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

              {activeTx.notes && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400 block mb-1">Catatan:</span>
                  <p className="text-xs bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl text-slate-700 dark:text-slate-300 italic">
                    "{activeTx.notes}"
                  </p>
                </div>
              )}
            </div>

            {/* Tombol Hapus Transaksi */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => handleDeleteTx(activeTx)}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Transaksi Ini</span>
              </button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

export default function WalletDetailPage() {
  return (
    <React.Suspense fallback={<WalletDetailPageSkeleton />}>
      <WalletDetailContent />
    </React.Suspense>
  );
}
