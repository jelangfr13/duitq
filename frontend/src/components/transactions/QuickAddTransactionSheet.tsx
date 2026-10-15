'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { useAppStore } from '@/lib/store';
import { useTransactions } from '@/hooks/useTransactions';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useStorageSpaces } from '@/hooks/useStorageSpaces';
import { TransactionType } from '@shared/types/transaction';
import { getErrorMessage } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  FolderSync,
  AlertCircle,
  ArrowRight,
  Wallet,
} from 'lucide-react';

export function QuickAddTransactionSheet() {
  const { isQuickAddOpen, quickAddType, editingTransaction, closeQuickAdd } = useAppStore();
  const { createTransaction, updateTransaction, isCreating, isUpdating } = useTransactions();
  const { fundingSources } = useFundingSources();
  const { storageSpaces } = useStorageSpaces();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [sourceFundingId, setSourceFundingId] = useState('');
  const [destinationFundingId, setDestinationFundingId] = useState('');
  const [storageSpaceId, setStorageSpaceId] = useState('');
  const [spaceFlowType, setSpaceFlowType] = useState<'IN' | 'OUT'>('IN');
  const [transactionDate, setTransactionDate] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Sync state saat sheet dibuka atau mode edit diaktifkan
  useEffect(() => {
    if (isQuickAddOpen) {
      setError(null);
      if (editingTransaction) {
        setType(editingTransaction.type);
        setAmountStr(editingTransaction.amount ? String(editingTransaction.amount) : '');
        setTitle(editingTransaction.title || '');
        setSourceFundingId(editingTransaction.sourceFundingId || '');
        setDestinationFundingId(editingTransaction.destinationFundingId || '');
        setStorageSpaceId(editingTransaction.storageSpaceId || '');
        setSpaceFlowType(editingTransaction.spaceFlowType || 'IN');
        setNotes(editingTransaction.notes || '');
        const d = editingTransaction.transactionDate
          ? new Date(editingTransaction.transactionDate)
          : new Date();
        setTransactionDate(d.toISOString().slice(0, 10));
      } else {
        setType(quickAddType);
        setAmountStr('');
        setTitle('');
        setNotes('');
        setTransactionDate(new Date().toISOString().slice(0, 10));
        setSourceFundingId(fundingSources[0]?._id || '');
        setDestinationFundingId(
          fundingSources.length > 1 ? fundingSources[1]?._id : fundingSources[0]?._id || ''
        );
        setStorageSpaceId(storageSpaces[0]?._id || '');
        setSpaceFlowType('IN');
      }
    }
  }, [isQuickAddOpen, quickAddType, editingTransaction, fundingSources, storageSpaces]);

  // Cegah Sumber Asal dan Tujuan bernilai sama saat berpindah ke mode TRANSFER
  useEffect(() => {
    if (type === 'TRANSFER' && sourceFundingId && destinationFundingId === sourceFundingId) {
      const other = fundingSources.find((fs) => fs._id !== sourceFundingId);
      setDestinationFundingId(other?._id || '');
    }
  }, [type, sourceFundingId, destinationFundingId, fundingSources]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Hanya izinkan angka integer
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(raw);
  };

  const formattedDisplayAmount = () => {
    if (!amountStr) return '';
    const num = parseInt(amountStr, 10);
    return isNaN(num) ? '' : new Intl.NumberFormat('id-ID').format(num);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseInt(amountStr, 10);
    if (!amount || amount <= 0) {
      setError('Nominal harus lebih dari 0');
      return;
    }
    if (!title.trim()) {
      setError('Judul transaksi wajib diisi');
      return;
    }

    if (type === 'INCOME' && !destinationFundingId) {
      setError('Pilih Sumber Dana Tujuan uang masuk');
      return;
    }
    if (type === 'EXPENSE' && !sourceFundingId) {
      setError('Pilih Sumber Dana yang digunakan untuk pengeluaran');
      return;
    }
    if (type === 'TRANSFER') {
      if (!sourceFundingId || !destinationFundingId) {
        setError('Pilih Sumber Dana Asal dan Tujuan transfer');
        return;
      }
      if (sourceFundingId === destinationFundingId) {
        setError('Sumber Dana Asal dan Tujuan tidak boleh sama');
        return;
      }
    }
    if (type === 'SPACE_ALLOCATION') {
      if (!storageSpaceId) {
        setError('Pilih Ruang Penyimpanan');
        return;
      }
    }

    const payload = {
      type,
      amount,
      title: title.trim(),
      notes: notes.trim() || undefined,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      sourceFundingId:
        type === 'EXPENSE' || type === 'TRANSFER'
          ? sourceFundingId
          : type === 'SPACE_ALLOCATION' && spaceFlowType === 'IN'
          ? sourceFundingId || null
          : null,
      destinationFundingId:
        type === 'INCOME' || type === 'TRANSFER'
          ? destinationFundingId
          : type === 'SPACE_ALLOCATION' && spaceFlowType === 'OUT'
          ? destinationFundingId || null
          : null,
      storageSpaceId:
        type === 'SPACE_ALLOCATION'
          ? storageSpaceId
          : storageSpaceId || null,
      spaceFlowType:
        type === 'SPACE_ALLOCATION'
          ? spaceFlowType
          : storageSpaceId
          ? type === 'INCOME'
            ? 'IN'
            : 'OUT'
          : null,
    };

    try {
      if (editingTransaction) {
        await updateTransaction({
          id: editingTransaction._id,
          dto: payload,
        });
      } else {
        await createTransaction(payload);
      }
      closeQuickAdd();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const isSubmitting = isCreating || isUpdating;

  // Siapkan options terstruktur untuk Select UI
  const fundingOptions: SelectOption[] = fundingSources.map((fs) => ({
    value: fs._id,
    label: fs.name,
    sublabel: `Saldo: ${formatRupiah(fs.currentBalance)}`,
    color: fs.color || '#2563EB',
  }));

  const expenseStorageOptions: SelectOption[] = [
    { value: '', label: 'Tanpa Ruang (Pengeluaran Umum)' },
    ...storageSpaces.map((sp) => ({
      value: sp._id,
      label: sp.name,
      sublabel: `Sisa: ${formatRupiah(sp.currentBalance)}`,
      color: sp.color || '#4F46E5',
    })),
  ];

  const incomeStorageOptions: SelectOption[] = [
    { value: '', label: 'Tanpa Ruang (Saldo Bebas)' },
    ...storageSpaces.map((sp) => ({
      value: sp._id,
      label: sp.name,
      sublabel: `Sisa: ${formatRupiah(sp.currentBalance)}`,
      color: sp.color || '#4F46E5',
    })),
  ];

  const transferDestinationOptions: SelectOption[] = fundingSources
    .filter((fs) => fs._id !== sourceFundingId)
    .map((fs) => ({
      value: fs._id,
      label: fs.name,
      sublabel: `Saldo: ${formatRupiah(fs.currentBalance)}`,
      color: fs.color || '#2563EB',
    }));

  const spaceOptions: SelectOption[] = storageSpaces.map((sp) => ({
    value: sp._id,
    label: sp.name,
    sublabel: `Sisa: ${formatRupiah(sp.currentBalance)}`,
    color: sp.color || '#4F46E5',
  }));

  const hasNoFundingSources = fundingSources.length === 0;

  return (
    <BottomSheet
      isOpen={isQuickAddOpen}
      onClose={closeQuickAdd}
      title={editingTransaction ? 'Ubah Catatan Transaksi' : 'Catat Transaksi Cepat'}
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-1 pb-16">
        {/* Peringatan jika belum ada Sumber Dana */}
        {hasNoFundingSources && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Belum Ada Sumber Dana</p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Anda belum memiliki rekening atau dompet. Tambahkan Sumber Dana terlebih dahulu untuk mulai mencatat transaksi.
              </p>
              <Link
                href="/wallets"
                onClick={closeQuickAdd}
                className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-700 underline text-xs pt-0.5"
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Buka Menu Dompet</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Peringatan khusus jika mode TRANSFER tapi sumber dana < 2 */}
        {type === 'TRANSFER' && fundingSources.length === 1 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-bold">Perlu Minimal 2 Sumber Dana</p>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Fitur Pindah Dana membutuhkan minimal 2 Sumber Dana berbeda.
              </p>
            </div>
          </div>
        )}

        {/* Tipe Transaksi Tabs */}
        {!editingTransaction && (
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 mb-0.5" />
              <span>Keluar</span>
            </button>
            <button
              type="button"
              onClick={() => setType('INCOME')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                type === 'INCOME'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 mb-0.5" />
              <span>Masuk</span>
            </button>
            <button
              type="button"
              onClick={() => setType('TRANSFER')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                type === 'TRANSFER'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mb-0.5" />
              <span>Transfer</span>
            </button>
            <button
              type="button"
              onClick={() => setType('SPACE_ALLOCATION')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                type === 'SPACE_ALLOCATION'
                  ? 'bg-indigo-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FolderSync className="w-4 h-4 mb-0.5" />
              <span>Alokasi</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Nominal Uang */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Nominal Rupiah (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formattedDisplayAmount()}
              onChange={handleAmountChange}
              className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-lg font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
              required
            />
          </div>
        </div>

        {/* Judul Transaksi */}
        <Input
          label="Judul / Keterangan"
          placeholder={
            type === 'INCOME'
              ? 'Misal: Gaji Bulanan, Bonus'
              : type === 'EXPENSE'
              ? 'Misal: Makan Siang, Bensin'
              : type === 'TRANSFER'
              ? 'Misal: Top up GoPay dari BCA'
              : 'Misal: Alokasi Uang Makan'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Form spesifik per Tipe menggunakan Custom Select */}
        {type === 'EXPENSE' && (
          <div className="space-y-3">
            <Select
              label="Sumber Dana yang Digunakan"
              placeholder="Pilih Sumber Dana"
              value={sourceFundingId}
              onChange={setSourceFundingId}
              options={fundingOptions}
              emptyMessage="Belum ada Sumber Dana aktif"
            />

            <Select
              label="Ruang Penyimpanan (Opsional)"
              placeholder="Pilih Ruang Penyimpanan"
              value={storageSpaceId}
              onChange={setStorageSpaceId}
              options={expenseStorageOptions}
              emptyMessage="Belum ada Ruang Penyimpanan kustom"
            />
          </div>
        )}

        {type === 'INCOME' && (
          <div className="space-y-3">
            <Select
              label="Sumber Dana Tujuan Masuk"
              placeholder="Pilih Sumber Dana Tujuan"
              value={destinationFundingId}
              onChange={setDestinationFundingId}
              options={fundingOptions}
              emptyMessage="Belum ada Sumber Dana aktif"
            />

            <Select
              label="Alokasi ke Ruang (Opsional)"
              placeholder="Pilih Ruang Penyimpanan"
              value={storageSpaceId}
              onChange={setStorageSpaceId}
              options={incomeStorageOptions}
              emptyMessage="Belum ada Ruang Penyimpanan kustom"
            />
          </div>
        )}

        {type === 'TRANSFER' && (
          <div className="grid grid-cols-2 gap-2">
            <Select
              label="Dari (Sumber Asal)"
              placeholder="Pilih Asal"
              value={sourceFundingId}
              onChange={(val) => {
                setSourceFundingId(val);
                if (destinationFundingId === val) {
                  setDestinationFundingId('');
                }
              }}
              options={fundingOptions}
              emptyMessage="Belum ada Sumber Dana"
            />

            <Select
              label="Ke (Sumber Tujuan)"
              placeholder="Pilih Tujuan"
              value={destinationFundingId}
              onChange={setDestinationFundingId}
              options={transferDestinationOptions}
              emptyMessage="Tidak ada pilihan tujuan lain"
            />
          </div>
        )}

        {type === 'SPACE_ALLOCATION' && (
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Arah Alokasi Ruang
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSpaceFlowType('IN')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    spaceFlowType === 'IN'
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Masuk ke Ruang (+)
                </button>
                <button
                  type="button"
                  onClick={() => setSpaceFlowType('OUT')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                    spaceFlowType === 'OUT'
                      ? 'border-rose-600 bg-rose-50 text-rose-700'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Keluar dari Ruang (-)
                </button>
              </div>
            </div>

            <Select
              label="Ruang Penyimpanan Terkait"
              placeholder="Pilih Ruang"
              value={storageSpaceId}
              onChange={setStorageSpaceId}
              options={spaceOptions}
              emptyMessage="Belum ada Ruang Penyimpanan"
            />
          </div>
        )}

        {/* Tanggal Transaksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white"
            required
          />
        </div>

        {/* Catatan Tambahan (Opsional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan jika diperlukan..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none bg-white"
          />
        </div>

        {/* Tombol Simpan */}
        <div className="pt-2">
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={hasNoFundingSources}
            className="w-full font-bold shadow-md shadow-blue-600/20 py-3"
          >
            {editingTransaction ? 'Simpan Perubahan' : 'Catat Transaksi'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
}
