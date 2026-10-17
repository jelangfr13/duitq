'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  Landmark,
  Smartphone,
  Banknote,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Check,
  History,
  AlertCircle,
} from 'lucide-react';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { WalletsSkeleton } from '@/components/ui/Skeleton';
import { formatRupiah, formatDateTime } from '@/lib/format';
import { IFundingSource, FundingSourceType } from '@shared/types/funding-source';
import { getErrorMessage } from '@/lib/api';

const COLOR_OPTIONS = [
  '#2563EB', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Purple
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#64748B', // Slate
];

export default function WalletsPage() {
  const { hideBalance, openQuickAdd } = useAppStore();
  const [selectedFundingId, setSelectedFundingId] = useState<string | undefined>();

  // Ambil daftar dan mutasi
  const {
    fundingSources,
    isLoading,
    createFundingSource,
    updateFundingSource,
    deleteFundingSource,
    isCreating,
    isUpdating,
    isDeleting,
  } = useFundingSources({
    includeTransactions: true,
    fundingSourceId: selectedFundingId,
  });

  // Modal State Tambah / Edit Sumber Dana (FND-01)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IFundingSource | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<FundingSourceType>('BANK');
  const [initialBalanceStr, setInitialBalanceStr] = useState('0');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [icon, setIcon] = useState('Landmark');
  const [error, setError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingSource(null);
    setName('');
    setType('BANK');
    setInitialBalanceStr('0');
    setColor(COLOR_OPTIONS[0]);
    setIcon('Landmark');
    setError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (source: IFundingSource) => {
    setEditingSource(source);
    setName(source.name);
    setType(source.type);
    setInitialBalanceStr(String(source.initialBalance));
    setColor(source.color || COLOR_OPTIONS[0]);
    setIcon(source.icon || 'Landmark');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nama sumber dana wajib diisi');
      return;
    }

    try {
      if (editingSource) {
        await updateFundingSource({
          id: editingSource._id,
          dto: {
            name: name.trim(),
            type,
            color,
            icon,
          },
        });
      } else {
        const initialBalance = parseInt(initialBalanceStr.replace(/[^0-9]/g, ''), 10) || 0;
        await createFundingSource({
          name: name.trim(),
          type,
          initialBalance,
          color,
          icon,
        });
      }
      setIsModalOpen(false);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (source: IFundingSource) => {
    if (
      confirm(
        `Yakin ingin menghapus Sumber Dana "${source.name}"? Pos anggaran yang terhubung dengan dompet ini juga akan dihapus secara otomatis.`
      )
    ) {
      try {
        await deleteFundingSource(source._id);
        if (selectedFundingId === source._id) {
          setSelectedFundingId(undefined);
        }
        setIsModalOpen(false);
      } catch (err) {
        alert(getErrorMessage(err));
      }
    }
  };

  // Icon mapping
  const renderIcon = (type: FundingSourceType, className = 'w-5 h-5') => {
    switch (type) {
      case 'BANK':
        return <Landmark className={className} />;
      case 'EWALLET':
        return <Smartphone className={className} />;
      case 'CASH':
        return <Banknote className={className} />;
      default:
        return <Wallet className={className} />;
    }
  };

  if (isLoading && (!fundingSources || fundingSources.length === 0)) {
    return <WalletsSkeleton />;
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Segmented Control: Sumber Dana vs Ruang Penyimpanan (Bab 7.1) */}
      <div className="flex p-1 bg-slate-200/80 dark:bg-slate-800 rounded-xl text-xs font-semibold">
        <button
          type="button"
          className="flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold transition-all text-center"
        >
          Sumber Dana
        </button>
        <Link
          href="/budgets"
          className="flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-all text-center"
        >
          Budgeting
        </Link>
      </div>

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Daftar Sumber Dana</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Rekening bank, e-wallet, dan uang tunai.</p>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            onClick={() => openQuickAdd('TRANSFER')}
            className="text-xs h-8 px-2.5"
            leftIcon={<ArrowLeftRight className="w-3.5 h-3.5" />}
          >
            Pindah Dana
          </Button>
          <Button
            size="sm"
            onClick={openCreateModal}
            className="text-xs h-8 px-2.5"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Tambah
          </Button>
        </div>
      </div>

      {/* List Kartu Sumber Dana */}
      <div className="space-y-3">
        {fundingSources.map((fs) => (
          <Card
            key={fs._id}
            className={`p-4 bg-white dark:bg-slate-900 border rounded-2xl shadow-xs transition-all relative overflow-hidden ${
              selectedFundingId === fs._id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100 dark:border-slate-800'
            }`}
          >
            {/* Color accent strip */}
            <div
              className="absolute left-0 top-0 bottom-0 w-1.5"
              style={{ backgroundColor: fs.color || '#2563EB' }}
            />

            <div className="flex items-start justify-between pl-1">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: fs.color || '#2563EB' }}
                >
                  {renderIcon(fs.type)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{fs.name}</h3>
                  <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    {fs.type}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => openEditModal(fs)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Ubah"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(fs)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title="Hapus"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between pl-1">
              <div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Saldo Terkini</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {hideBalance ? '••••••••' : formatRupiah(fs.currentBalance)}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedFundingId((prev) => (prev === fs._id ? undefined : fs._id))
                }
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>{selectedFundingId === fs._id ? 'Tutup Mutasi' : 'Lihat Mutasi'}</span>
              </button>
            </div>
          </Card>
        ))}

        {fundingSources.length === 0 && (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <Wallet className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Belum Ada Sumber Dana</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Tambahkan rekening bank atau dompet pertama Anda.
            </p>
            <Button size="sm" onClick={openCreateModal} className="mt-4 text-xs">
              + Tambah Sumber Dana
            </Button>
          </Card>
        )}
      </div>

      {/* Riwayat Mutasi Kronologis per Sumber Dana (FND-04) */}
      {selectedFundingId && (
        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Riwayat Mutasi Kronologis
            </h3>
            <button
              type="button"
              onClick={() => setSelectedFundingId(undefined)}
              className="text-[11px] text-slate-400 hover:text-slate-600"
            >
              Tutup
            </button>
          </div>

          <p className="text-[11px] text-slate-500">
            Menampilkan seluruh uang masuk, uang keluar, transfer, dan piutang terkait rekening ini.
          </p>
          <div className="text-center py-4 text-xs text-slate-400">
            Mutasi terbaru tersinkronisasi otomatis dengan Dashboard.
          </div>
        </Card>
      )}

      {/* Modal / Bottom Sheet Form Tambah & Edit Sumber Dana (FND-01) */}
      <BottomSheet
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSource ? 'Ubah Sumber Dana' : 'Tambah Sumber Dana Baru'}
      >
        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Input
            label="Nama Sumber Dana"
            placeholder="Misal: Rekening BCA, Dompet Tunai, GoPay"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tipe</label>
            <div className="grid grid-cols-4 gap-1.5">
              {(['BANK', 'EWALLET', 'CASH', 'OTHER'] as FundingSourceType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2 px-1 text-[11px] rounded-xl border text-center font-semibold transition-all ${
                    type === t
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {!editingSource && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Saldo Awal (Rp)
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={new Intl.NumberFormat('id-ID').format(
                  parseInt(initialBalanceStr.replace(/[^0-9]/g, '') || '0', 10)
                )}
                onChange={(e) =>
                  setInitialBalanceStr(e.target.value.replace(/[^0-9]/g, ''))
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              />
            </div>
          )}

          {/* Pemilihan Warna */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Warna Aksen</label>
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

          <div className="pt-2 flex items-center gap-2">
            {editingSource && (
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDelete(editingSource)}
                className="text-xs text-rose-600 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                isLoading={isDeleting}
              >
                Hapus
              </Button>
            )}
            <Button
              type="submit"
              isLoading={isCreating || isUpdating}
              className="flex-1 font-bold"
            >
              {editingSource ? 'Simpan Perubahan' : 'Tambah Sumber Dana'}
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
