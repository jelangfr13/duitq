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
import { useBudgets } from '@/hooks/useBudgets';
import { TransactionType } from '@shared/types/transaction';
import { getErrorMessage } from '@/lib/api';
import { formatRupiah } from '@/lib/format';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  AlertCircle,
  ArrowRight,
  Wallet,
} from 'lucide-react';

export function QuickAddTransactionSheet() {
  const { isQuickAddOpen, quickAddType, editingTransaction, closeQuickAdd } = useAppStore();
  const { createTransaction, updateTransaction, isCreating, isUpdating } = useTransactions();
  const { fundingSources } = useFundingSources();
  const { budgets } = useBudgets();

  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amountStr, setAmountStr] = useState('');
  const [title, setTitle] = useState('');
  const [sourceFundingId, setSourceFundingId] = useState('');
  const [destinationFundingId, setDestinationFundingId] = useState('');
  const [budgetId, setBudgetId] = useState('');
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
        setBudgetId(editingTransaction.budgetId || '');
        setNotes(editingTransaction.notes || '');
        const d = editingTransaction.transactionDate
          ? new Date(editingTransaction.transactionDate)
          : new Date();
        setTransactionDate(d.toISOString().slice(0, 10));
      } else {
        setType(quickAddType === 'SPACE_ALLOCATION' ? 'EXPENSE' : quickAddType);
        setAmountStr('');
        setTitle('');
        setNotes('');
        setTransactionDate(new Date().toISOString().slice(0, 10));
        setSourceFundingId(fundingSources[0]?._id || '');
        setDestinationFundingId(
          fundingSources.length > 1 ? fundingSources[1]?._id : fundingSources[0]?._id || ''
        );
        setBudgetId('');
      }
    }
  }, [isQuickAddOpen, quickAddType, editingTransaction, fundingSources]);

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

  // Pilih pos anggaran: otomatis cocokkan Sumber Dana yang dialokasikan untuk anggaran tersebut
  const handleBudgetChange = (selectedBudgetId: string) => {
    setBudgetId(selectedBudgetId);
    if (selectedBudgetId) {
      const selectedBudget = budgets.find((b) => b._id === selectedBudgetId);
      if (selectedBudget && selectedBudget.fundingSourceId) {
        const fsId =
          typeof selectedBudget.fundingSourceId === 'string'
            ? selectedBudget.fundingSourceId
            : (selectedBudget.fundingSourceId as any)._id;
        if (fsId) {
          setSourceFundingId(fsId);
        }
      }
    }
  };

  // Jika user mengubah Sumber Dana, periksa apakah budget aktif masih sesuai
  const handleSourceFundingChange = (newSourceId: string) => {
    setSourceFundingId(newSourceId);
    if (budgetId) {
      const selectedBudget = budgets.find((b) => b._id === budgetId);
      if (selectedBudget && selectedBudget.fundingSourceId) {
        const fsId =
          typeof selectedBudget.fundingSourceId === 'string'
            ? selectedBudget.fundingSourceId
            : (selectedBudget.fundingSourceId as any)._id;
        if (fsId && fsId !== newSourceId) {
          setBudgetId('');
        }
      }
    }
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

    const payload = {
      type,
      amount,
      title: title.trim(),
      notes: notes.trim() || undefined,
      transactionDate: transactionDate ? new Date(transactionDate) : new Date(),
      sourceFundingId:
        type === 'EXPENSE' || type === 'TRANSFER'
          ? sourceFundingId
          : null,
      destinationFundingId:
        type === 'INCOME' || type === 'TRANSFER'
          ? destinationFundingId
          : null,
      budgetId: type === 'EXPENSE' && budgetId ? budgetId : null,
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

  const budgetOptions: SelectOption[] = [
    { value: '', label: 'Tanpa Pos Budget (Pengeluaran Umum)' },
    ...budgets.map((b) => {
      const fsName =
        typeof b.fundingSourceId === 'object' && b.fundingSourceId
          ? b.fundingSourceId.name
          : b.fundingSource?.name || 'Dompet';
      const remaining = Math.max(0, b.amount - b.spentAmount);
      return {
        value: b._id,
        label: b.name,
        sublabel: `${fsName} • Sisa ${formatRupiah(remaining)}`,
        color: b.color || '#2563EB',
      };
    }),
  ];

  const transferDestinationOptions: SelectOption[] = fundingSources
    .filter((fs) => fs._id !== sourceFundingId)
    .map((fs) => ({
      value: fs._id,
      label: fs.name,
      sublabel: `Saldo: ${formatRupiah(fs.currentBalance)}`,
      color: fs.color || '#2563EB',
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
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setType('EXPENSE')}
              className={`flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all cursor-pointer ${
                type === 'EXPENSE'
                  ? 'bg-rose-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
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
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4 mb-0.5" />
              <span>Transfer</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Nominal Uang */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Nominal Rupiah (Rp)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={formattedDisplayAmount()}
              onChange={handleAmountChange}
              className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-lg font-bold text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
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
              : 'Misal: Top up GoPay dari BCA'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        {/* Form spesifik per Tipe menggunakan Custom Select */}
        {type === 'EXPENSE' && (
          <div className="space-y-3">
            <Select
              label="Pos Anggaran / Budgeting (Opsional)"
              placeholder="Pilih Pos Anggaran"
              value={budgetId}
              onChange={handleBudgetChange}
              options={budgetOptions}
              emptyMessage="Belum ada Pos Anggaran"
            />

            <Select
              label="Sumber Dana yang Digunakan"
              placeholder="Pilih Sumber Dana"
              value={sourceFundingId}
              onChange={handleSourceFundingChange}
              options={fundingOptions}
              emptyMessage="Belum ada Sumber Dana aktif"
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

        {/* Tanggal Transaksi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Tanggal Transaksi
          </label>
          <input
            type="date"
            value={transactionDate}
            onChange={(e) => setTransactionDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-white dark:bg-slate-900"
            required
          />
        </div>

        {/* Catatan Tambahan (Opsional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tambahkan catatan jika diperlukan..."
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 resize-none bg-white dark:bg-slate-900"
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
