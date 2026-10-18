'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  PieChart,
  Plus,
  Wallet,
  TrendingDown,
  History,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  Utensils,
  Car,
  ShoppingBag,
  Coffee,
  HeartPulse,
  Film,
  Zap,
  MoreVertical,
  AlertTriangle,
} from 'lucide-react';
import { useBudgets, useBudgetTransactions } from '@/hooks/useBudgets';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/components/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { BudgetsSkeleton } from '@/components/ui/Skeleton';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { IBudget } from '@shared/types/budget';
import { getErrorMessage } from '@/lib/api';

const COLOR_OPTIONS = [
  '#2563EB', // Blue
  '#059669', // Emerald
  '#7C3AED', // Violet
  '#E11D48', // Rose
  '#D97706', // Amber
  '#4F46E5', // Indigo
  '#0891B2', // Cyan
];

const PRESET_ICONS = [
  { name: 'Utensils', label: 'Makan', icon: <Utensils className="w-4 h-4" /> },
  { name: 'Car', label: 'Transport', icon: <Car className="w-4 h-4" /> },
  { name: 'ShoppingBag', label: 'Belanja', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'Coffee', label: 'Kopi / Jajan', icon: <Coffee className="w-4 h-4" /> },
  { name: 'HeartPulse', label: 'Kesehatan', icon: <HeartPulse className="w-4 h-4" /> },
  { name: 'Film', label: 'Hiburan', icon: <Film className="w-4 h-4" /> },
  { name: 'Zap', label: 'Tagihan', icon: <Zap className="w-4 h-4" /> },
  { name: 'PieChart', label: 'Umum', icon: <PieChart className="w-4 h-4" /> },
];

export default function BudgetsPage() {
  const { hideBalance } = useAppStore();
  const { themeColor } = useTheme();
  const {
    budgets,
    summary,
    isLoading,
    createBudget,
    updateBudget,
    deleteBudget,
    isCreating,
    isUpdating,
  } = useBudgets();
  const { fundingSources } = useFundingSources();

  // Modal State Tambah / Edit Anggaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<IBudget | null>(null);
  const [name, setName] = useState('');
  const [fundingSourceId, setFundingSourceId] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('PieChart');
  const [error, setError] = useState<string | null>(null);

  // State Drawer Detail Mutasi Anggaran
  const [activeBudgetForTx, setActiveBudgetForTx] = useState<IBudget | null>(null);
  const { data: budgetTxData, isLoading: isLoadingTx } = useBudgetTransactions(
    activeBudgetForTx?._id
  );

  // Opsi Dropdown Sumber Dana
  const fundingOptions: SelectOption[] = useMemo(() => {
    return fundingSources.map((fs) => ({
      value: fs._id,
      label: fs.name,
      sublabel: hideBalance ? undefined : `Saldo: ${formatRupiah(fs.currentBalance)}`,
      color: fs.color,
    }));
  }, [fundingSources, hideBalance]);

  const openCreateModal = () => {
    setEditingBudget(null);
    setName('');
    setFundingSourceId(fundingSources[0]?._id || '');
    setAmountStr('');
    setColor(COLOR_OPTIONS[0]);
    setIcon('PieChart');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (b: IBudget) => {
    setEditingBudget(b);
    setName(b.name);
    const fsId = typeof b.fundingSourceId === 'string' ? b.fundingSourceId : b.fundingSourceId._id;
    setFundingSourceId(fsId);
    setAmountStr(b.amount.toString());
    setColor(b.color || COLOR_OPTIONS[0]);
    setIcon(b.icon || 'PieChart');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama anggaran wajib diisi');
      return;
    }

    if (!fundingSourceId) {
      setError('Sumber dana asal wajib dipilih');
      return;
    }

    const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!cleanAmount || cleanAmount <= 0) {
      setError('Jumlah alokasi anggaran harus lebih dari 0');
      return;
    }

    if (selectedFundingSource && cleanAmount > selectedFundingSource.currentBalance) {
      setError(
        `Saldo ${selectedFundingSource.name} (${formatRupiah(selectedFundingSource.currentBalance)}) tidak mencukupi untuk nominal anggaran ${formatRupiah(cleanAmount)}`
      );
      return;
    }

    try {
      if (editingBudget) {
        await updateBudget({
          id: editingBudget._id,
          dto: {
            name: name.trim(),
            fundingSourceId,
            amount: cleanAmount,
            color,
            icon,
          },
        });
      } else {
        await createBudget({
          name: name.trim(),
          fundingSourceId,
          amount: cleanAmount,
          color,
          icon,
          period: 'MONTHLY',
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (b: IBudget) => {
    if (confirm(`Yakin ingin menghapus pos anggaran "${b.name}"? Riwayat transaksi pengeluaran tidak akan terhapus.`)) {
      try {
        await deleteBudget(b._id);
      } catch (err) {
        alert(getErrorMessage(err));
      }
    }
  };

  const renderBudgetIcon = (iconName?: string, className = 'w-5 h-5') => {
    switch (iconName) {
      case 'Utensils':
        return <Utensils className={className} />;
      case 'Car':
        return <Car className={className} />;
      case 'ShoppingBag':
        return <ShoppingBag className={className} />;
      case 'Coffee':
        return <Coffee className={className} />;
      case 'HeartPulse':
        return <HeartPulse className={className} />;
      case 'Film':
        return <Film className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      default:
        return <PieChart className={className} />;
    }
  };

  // Cari nama sumber dana untuk hint edukatif di modal
  const selectedFundingSource = fundingSources.find((fs) => fs._id === fundingSourceId);
  const cleanAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10) || 0;
  const isInsufficientBalance = Boolean(
    selectedFundingSource && cleanAmount > 0 && cleanAmount > selectedFundingSource.currentBalance
  );

  if (isLoading && (!budgets || budgets.length === 0)) {
    return <BudgetsSkeleton />;
  }

  return (
    <div className="space-y-4 px-4 pt-4 overflow-x-hidden max-w-full">
      {/* Segmented Control: Sumber Dana vs Budgeting */}
      <div className="flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-semibold">
        <Link
          href="/wallets"
          className="flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all text-center"
        >
          Sumber Dana
        </Link>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold transition-all text-center"
        >
          Budgeting
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Budgeting & Alokasi
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Rencanakan pos belanja terikat dompet tanpa memotong saldo awal.
          </p>
        </div>

        <Button
          size="sm"
          onClick={openCreateModal}
          style={{ backgroundColor: themeColor }}
          leftIcon={<Plus className="w-4 h-4 stroke-[2.5]" />}
          className="text-xs h-9 px-3.5 shadow-xs cursor-pointer"
        >
          Tambah
        </Button>
      </div>

      {/* Ringkasan Akumulasi Budgeting */}
      <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500">
            Kondisi Seluruh Anggaran
          </p>
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            {summary.totalAllocated > 0
              ? `${Math.round((summary.totalRemaining / summary.totalAllocated) * 100)}% Tersisa`
              : '0% Tersisa'}
          </span>
        </div>

        {/* Bar Total Sisa Uang Berkurang */}
        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width: `${
                summary.totalAllocated > 0
                  ? Math.max(0, Math.min(100, Math.round((summary.totalRemaining / summary.totalAllocated) * 100)))
                  : 0
              }%`,
            }}
          />
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-850">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-0.5">Plafon Anggaran</span>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate block">
              {hideBalance ? '••••••' : formatRupiah(summary.totalAllocated)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20">
            <span className="text-[10px] text-rose-600 dark:text-rose-400 block mb-0.5">Sudah Terpakai</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400 truncate block">
              {hideBalance ? '••••••' : formatRupiah(summary.totalSpent)}
            </span>
          </div>

          <div className="p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mb-0.5">Sisa Saldo</span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate block">
              {hideBalance ? '••••••' : formatRupiah(summary.totalRemaining)}
            </span>
          </div>
        </div>
      </Card>

      {/* Daftar Pos Anggaran (Budget Cards) */}
      <div className="space-y-3">
        {budgets.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
              <PieChart className="w-6 h-6 stroke-[2]" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum Ada Pos Anggaran</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
              Buat pos anggaran seperti Uang Makan, Bensin, atau Belanja yang terikat ke rekening tertentu agar belanja Anda terkontrol rapi.
            </p>
            <Button
              size="sm"
              onClick={openCreateModal}
              style={{ backgroundColor: themeColor }}
              className="mt-4 text-xs h-9 px-4 cursor-pointer"
            >
              Buat Anggaran Pertama
            </Button>
          </Card>
        ) : (
          budgets.map((b) => {
            const fs = typeof b.fundingSourceId === 'object' ? b.fundingSourceId : null;
            const remaining = b.remainingAmount ?? Math.max(0, b.amount - b.spentAmount);
            const isOverBudget = b.spentAmount > b.amount;
            const remainingPercent =
              b.amount > 0 ? Math.round((Math.max(0, b.amount - b.spentAmount) / b.amount) * 100) : 0;

            // Warna semantik progress bar sisa uang berkurang
            const remainingBarColor =
              isOverBudget || remainingPercent <= 20
                ? 'bg-rose-500'
                : remainingPercent <= 50
                ? 'bg-amber-500'
                : 'bg-emerald-500';

            const remainingBadgeStyle = isOverBudget
              ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
              : remainingPercent <= 20
              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
              : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800';

            return (
              <Card
                key={b._id}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:border-slate-200 dark:hover:border-slate-700"
              >
                {/* Baris Atas: Ikon, Nama, Sumber Dana, dan Tombol Menu */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-xl text-white flex items-center justify-center shrink-0 shadow-xs"
                      style={{ backgroundColor: b.color || '#2563EB' }}
                    >
                      {renderBudgetIcon(b.icon, 'w-5 h-5 stroke-[2.2]')}
                    </div>

                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                        {b.name}
                      </h4>

                      {/* Tag Sumber Dana Asal */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: fs?.color || '#2563EB' }}
                        />
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                          Sumber: <strong className="text-slate-700 dark:text-slate-300">{fs?.name || 'Sumber Dana'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Button */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setActiveBudgetForTx(b)}
                      title="Lihat Mutasi Pengeluaran"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(b)}
                      title="Ubah Anggaran"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(b)}
                      title="Hapus Anggaran"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Bagian Utama: Sisa Uang Berkurang */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-end justify-between mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                        Sisa Saldo Anggaran
                      </span>
                      <div className="flex items-baseline gap-2">
                        <p
                          className={`text-xl font-extrabold tabular-nums tracking-tight ${
                            isOverBudget
                              ? 'text-rose-600 dark:text-rose-400'
                              : remainingPercent <= 20
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {hideBalance ? 'Rp ••••••••' : formatRupiah(remaining)}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${remainingBadgeStyle}`}>
                        {isOverBudget ? (
                          <>
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            <span>Over -{formatRupiah(b.spentAmount - b.amount)}</span>
                          </>
                        ) : (
                          <span>Sisa {remainingPercent}%</span>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar Sisa Uang (Menyusut ke arah kiri seiring belanja bertambah) */}
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${remainingBarColor}`}
                      style={{ width: `${Math.max(0, Math.min(100, remainingPercent))}%` }}
                    />
                  </div>

                  {/* Info Rincian: Terpakai & Plafon Anggaran */}
                  <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1 text-[11px]">
                      Terpakai:{' '}
                      <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                        {hideBalance ? '••••••' : formatRupiah(b.spentAmount)}
                      </strong>
                    </span>
                    <span className="flex items-center gap-1 text-[11px]">
                      Plafon Anggaran:{' '}
                      <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                        {hideBalance ? '••••••' : formatRupiah(b.amount)}
                      </strong>
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Modal BottomSheet: Tambah / Ubah Anggaran */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Ubah Pos Anggaran' : 'Buat Pos Anggaran Baru'}
      >
        <form onSubmit={handleSubmit} className="space-y-4 pt-1 pb-6">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Nama Anggaran */}
          <Input
            label="Nama Pos Anggaran"
            placeholder="Misal: Uang Makan, Bensin, Belanja"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          {/* Pilih Sumber Dana Asal */}
          <Select
            label="Sumber Dana Pengambil Dana"
            placeholder="Pilih Sumber Dana"
            value={fundingSourceId}
            onChange={setFundingSourceId}
            options={fundingOptions}
            emptyMessage="Belum ada Sumber Dana aktif"
          />

          {/* Batas Plafon Anggaran (Rp) */}
          <div className="space-y-1">
            <Input
              label="Plafon / Batas Anggaran (Rp)"
              placeholder="Contoh: 500.000"
              value={
                amountStr
                  ? parseInt(amountStr.replace(/[^0-9]/g, ''), 10).toLocaleString('id-ID')
                  : ''
              }
              onChange={(e) => {
                setAmountStr(e.target.value.replace(/[^0-9]/g, ''));
                if (error) setError(null);
              }}
              required
            />
            {selectedFundingSource && (
              <div className="flex items-center justify-between text-[11px] px-1 pt-0.5">
                <span className="text-slate-500 dark:text-slate-400">
                  Saldo Tersedia ({selectedFundingSource.name}):
                </span>
                <span
                  className={`font-semibold ${
                    isInsufficientBalance
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {formatRupiah(selectedFundingSource.currentBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Peringatan jika saldo sumber dana tidak mencukupi */}
          {isInsufficientBalance && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[11px]">Saldo Tidak Mencukupi</p>
                <p className="text-[11px] leading-relaxed">
                  Plafon anggaran melebihi saldo yang tersedia di dompet <strong>{selectedFundingSource?.name}</strong>. Anda tidak dapat membuat anggaran melebihi saldo dompet.
                </p>
              </div>
            </div>
          )}

          {/* Banner Edukatif Sesuai Logika Baru */}
          <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/40 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
            <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Pos anggaran ini berfungsi sebagai <strong>batas pengeluaran belanja</strong>. Saldo{' '}
              {selectedFundingSource ? <strong>{selectedFundingSource.name}</strong> : 'sumber dana'}{' '}
              <strong>tidak terpotong di awal</strong>, melainkan akan <strong>berkurang seiring Anda mencatat pengeluaran</strong> menggunakan pos ini.
            </p>
          </div>

          {/* Pilihan Ikon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Ikon Pos
            </label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_ICONS.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setIcon(item.name)}
                  className={`p-2 rounded-xl border flex flex-col items-center gap-1 text-[11px] transition-all cursor-pointer ${
                    icon === item.name
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-bold ring-1 ring-blue-600'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pilihan Warna */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Warna Aksen
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 cursor-pointer shadow-xs"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            isLoading={isCreating || isUpdating}
            disabled={isInsufficientBalance}
            style={{ backgroundColor: isInsufficientBalance ? undefined : themeColor }}
            className={`w-full text-xs font-bold py-3 mt-2 cursor-pointer ${
              isInsufficientBalance ? 'opacity-50 cursor-not-allowed bg-slate-400 dark:bg-slate-700' : ''
            }`}
          >
            {isInsufficientBalance
              ? 'Saldo Dompet Kurang'
              : editingBudget
              ? 'Simpan Perubahan'
              : 'Buat Pos Anggaran'}
          </Button>
        </form>
      </BottomSheet>

      {/* Drawer Detail Mutasi Pos Anggaran */}
      <BottomSheet
        isOpen={!!activeBudgetForTx}
        onClose={() => setActiveBudgetForTx(null)}
        title={activeBudgetForTx ? `Mutasi: ${activeBudgetForTx.name}` : 'Mutasi Anggaran'}
      >
        <div className="space-y-4 pb-6">
          {activeBudgetForTx && (
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Plafon Anggaran</span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {hideBalance ? '••••••' : formatRupiah(activeBudgetForTx.amount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sudah Terpakai</span>
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {hideBalance ? '••••••' : formatRupiah(activeBudgetForTx.spentAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-medium">Sisa Saldo</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {hideBalance
                      ? '••••••'
                      : formatRupiah(
                          activeBudgetForTx.remainingAmount ??
                            Math.max(0, activeBudgetForTx.amount - activeBudgetForTx.spentAmount)
                        )}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Riwayat Pengeluaran Pos Ini
            </h4>

            {isLoadingTx ? (
              <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat transaksi...</div>
            ) : !budgetTxData?.transactions || budgetTxData.transactions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada transaksi pengeluaran yang dicatat menggunakan pos anggaran ini.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {budgetTxData.transactions.map((tx: any) => (
                  <div
                    key={tx._id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs bg-white dark:bg-slate-900"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-slate-100">{tx.title}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {formatDateTime(tx.transactionDate)}
                      </p>
                    </div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      -{formatRupiah(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
