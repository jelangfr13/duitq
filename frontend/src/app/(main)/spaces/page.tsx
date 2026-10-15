'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  TrendingUp,
  TrendingDown,
  History,
  AlertCircle,
  Check,
  ArrowDownLeft,
  ArrowUpRight,
  FolderSync,
} from 'lucide-react';
import { useStorageSpaces, useStorageSpaceTransactions } from '@/hooks/useStorageSpaces';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { IStorageSpace } from '@shared/types/storage-space';
import { getErrorMessage } from '@/lib/api';

const COLOR_OPTIONS = [
  '#4F46E5', // Indigo
  '#059669', // Emerald
  '#DC2626', // Rose
  '#D97706', // Amber
  '#7C3AED', // Violet
  '#DB2777', // Pink
  '#2563EB', // Blue
];

export default function SpacesPage() {
  const { hideBalance, openQuickAdd } = useAppStore();
  const { storageSpaces, createStorageSpace, isCreating } = useStorageSpaces();

  // State Modal Tambah Ruang (SPC-01)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyLimitStr, setMonthlyLimitStr] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('Layers');
  const [error, setError] = useState<string | null>(null);

  // State Drawer Detail Mutasi Ruang (GET /storage-spaces/:id/transactions)
  const [activeSpaceForTx, setActiveSpaceForTx] = useState<IStorageSpace | null>(null);
  const { data: spaceDetail, isLoading: isLoadingTx } = useStorageSpaceTransactions(
    activeSpaceForTx?._id
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama ruang penyimpanan wajib diisi');
      return;
    }

    try {
      const monthlyBudgetLimit = monthlyLimitStr
        ? parseInt(monthlyLimitStr.replace(/[^0-9]/g, ''), 10)
        : undefined;

      await createStorageSpace({
        name: name.trim(),
        description: description.trim() || undefined,
        monthlyBudgetLimit: monthlyBudgetLimit || undefined,
        color,
        icon,
      });

      setIsCreateOpen(false);
      setName('');
      setDescription('');
      setMonthlyLimitStr('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Segmented Control: Sumber Dana vs Ruang Penyimpanan (Bab 7.1) */}
      <div className="flex p-1 bg-slate-200/80 rounded-xl text-xs font-semibold">
        <Link
          href="/wallets"
          className="flex-1 py-2 rounded-lg text-slate-500 hover:text-slate-800 transition-all text-center"
        >
          Sumber Dana
        </Link>
        <button
          type="button"
          className="flex-1 py-2 rounded-lg bg-white text-slate-900 shadow-xs font-bold transition-all text-center"
        >
          Ruang Penyimpanan
        </button>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Pos Anggaran / Ruang</h1>
          <p className="text-[11px] text-slate-500">Kantong alokasi pengeluaran & tabungan Anda.</p>
        </div>

        <Button
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs h-8 px-2.5"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Tambah Ruang
        </Button>
      </div>

      {/* Daftar Ruang Penyimpanan Kustom (SPC-04) */}
      <div className="space-y-3">
        {storageSpaces.map((space) => {
          const denominator = space.monthlyBudgetLimit || space.totalIn || 1;
          const usagePercent = Math.min(
            100,
            Math.round((space.totalOut / denominator) * 100)
          );
          const isOverBudget = space.monthlyBudgetLimit
            ? space.totalOut > space.monthlyBudgetLimit
            : false;

          return (
            <Card
              key={space._id}
              className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-3 relative overflow-hidden"
            >
              {/* Color accent strip */}
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: space.color || '#4F46E5' }}
              />

              <div className="flex items-start justify-between pl-1">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: space.color || '#4F46E5' }}
                  >
                    <Layers className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{space.name}</h3>
                    {space.description && (
                      <p className="text-[11px] text-slate-400 line-clamp-1">
                        {space.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveSpaceForTx(space)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Mutasi</span>
                </button>
              </div>

              {/* Status Saldo & Rincian (totalIn, totalOut, currentBalance) */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center pl-1">
                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-emerald-600 font-semibold mb-0.5">
                    <TrendingUp className="w-3 h-3" />
                    <span>Masuk</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 tabular-nums">
                    {hideBalance ? '••••' : formatRupiah(space.totalIn)}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-slate-50">
                  <div className="flex items-center justify-center gap-1 text-[10px] text-rose-600 font-semibold mb-0.5">
                    <TrendingDown className="w-3 h-3" />
                    <span>Keluar</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 tabular-nums">
                    {hideBalance ? '••••' : formatRupiah(space.totalOut)}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-blue-50/60">
                  <div className="text-[10px] text-blue-700 font-semibold mb-0.5">
                    <span>Sisa Dana</span>
                  </div>
                  <p className="text-xs font-extrabold text-blue-900 tabular-nums">
                    {hideBalance ? '••••' : formatRupiah(space.currentBalance)}
                  </p>
                </div>
              </div>

              {/* Progress Bar Persentase Pemakaian (SPC-04) */}
              <div className="space-y-1.5 pl-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">
                    {space.monthlyBudgetLimit
                      ? `Batas: ${formatRupiah(space.monthlyBudgetLimit)}`
                      : 'Pemakaian Terhadap Alokasi'}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isOverBudget
                        ? 'text-rose-600'
                        : usagePercent > 80
                        ? 'text-amber-600'
                        : 'text-slate-700'
                    }`}
                  >
                    {usagePercent}%
                  </span>
                </div>

                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverBudget
                        ? 'bg-rose-500'
                        : usagePercent > 80
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, usagePercent)}%` }}
                  />
                </div>
              </div>
            </Card>
          );
        })}

        {storageSpaces.length === 0 && (
          <Card className="p-8 text-center bg-white border border-slate-100 rounded-2xl">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600">Belum Ada Ruang Penyimpanan</p>
            <p className="text-[11px] text-slate-400 mt-1">
              Buat pos anggaran pertama Anda (misal: "Uang Makan", "Bensin", "Belanja Bulanan").
            </p>
            <Button size="sm" onClick={() => setIsCreateOpen(true)} className="mt-4 text-xs">
              + Tambah Ruang Baru
            </Button>
          </Card>
        )}
      </div>

      {/* Modal Tambah Ruang Kustom (SPC-01) */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Buat Ruang Penyimpanan Baru"
      >
        <form onSubmit={handleCreate} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nama Ruang / Pos Anggaran"
            placeholder="Misal: Uang Makan, Dana Liburan, Belanja"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Keterangan (Opsional)"
            placeholder="Catatan tambahan untuk pos ini..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Batas Anggaran Bulanan (Opsional)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0 (Tidak terbatas)"
                value={
                  monthlyLimitStr
                    ? new Intl.NumberFormat('id-ID').format(
                        parseInt(monthlyLimitStr.replace(/[^0-9]/g, '') || '0', 10)
                      )
                    : ''
                }
                onChange={(e) =>
                  setMonthlyLimitStr(e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Ruang</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-95"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white stroke-[3]" />}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={isCreating} className="w-full font-bold">
              Buat Ruang Penyimpanan
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Drawer Detail Mutasi Ruang Khusus (GET /storage-spaces/:id/transactions) */}
      <BottomSheet
        isOpen={!!activeSpaceForTx}
        onClose={() => setActiveSpaceForTx(null)}
        title={`Mutasi ${activeSpaceForTx?.name || 'Ruang'}`}
      >
        <div className="space-y-3 pt-1">
          {isLoadingTx ? (
            <div className="py-8 text-center text-xs text-slate-400">Memuat mutasi...</div>
          ) : spaceDetail?.transactions && spaceDetail.transactions.length > 0 ? (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {spaceDetail.transactions.map((tx: any) => {
                const isIncoming = tx.spaceFlowType === 'IN' || tx.type === 'INCOME';

                return (
                  <div
                    key={tx._id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          isIncoming
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {isIncoming ? (
                          <ArrowDownLeft className="w-4 h-4 stroke-[2.2]" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 stroke-[2.2]" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{tx.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {formatDateTime(tx.transactionDate)}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`font-bold tabular-nums ${
                        isIncoming ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncoming ? '+' : '-'}
                      {formatRupiah(tx.amount)}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Belum ada mutasi transaksi pada ruang ini.
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
}
