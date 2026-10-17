'use client';

import React, { useState } from 'react';
import {
  HandCoins,
  Plus,
  Calendar,
  User,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useDashboard } from '@/hooks/useDashboard';
import { useReceivables } from '@/hooks/useReceivables';
import { useFundingSources } from '@/hooks/useFundingSources';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Select, SelectOption } from '@/components/ui/Select';
import { ReceivablesSkeleton } from '@/components/ui/Skeleton';
import { formatRupiah, formatDate } from '@/lib/format';
import { IReceivable } from '@shared/types/receivable';
import { getErrorMessage } from '@/lib/api';

export default function ReceivablesPage() {
  const { hideBalance } = useAppStore();
  const { data: dashboard, isLoading } = useDashboard();
  const { createReceivable, repayReceivable, isCreating, isRepaying } = useReceivables();
  const { fundingSources } = useFundingSources();

  // Modal State Catat Piutang Baru (RCV-02)
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [debtorName, setDebtorName] = useState('');
  const [debtorContact, setDebtorContact] = useState('');
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [sourceFundingId, setSourceFundingId] = useState('');
  const [loanDate, setLoanDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal State Catat Pelunasan (RCV-03)
  const [repayTarget, setRepayTarget] = useState<IReceivable | null>(null);
  const [repayAmountStr, setRepayAmountStr] = useState('');
  const [destinationFundingId, setDestinationFundingId] = useState('');
  const [repayNotes, setRepayNotes] = useState('');
  const [repayError, setRepayError] = useState<string | null>(null);

  const receivables = dashboard?.activeReceivables || [];

  const handleOpenCreate = () => {
    setDebtorName('');
    setDebtorContact('');
    setTitle('');
    setAmountStr('');
    setSourceFundingId(fundingSources[0]?._id || '');
    setLoanDate(new Date().toISOString().slice(0, 10));
    setDueDate('');
    setCreateError(null);
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const initialAmount = parseInt(amountStr.replace(/[^0-9]/g, ''), 10);
    if (!initialAmount || initialAmount <= 0) {
      setCreateError('Nominal piutang harus lebih dari 0');
      return;
    }
    if (!debtorName.trim()) {
      setCreateError('Nama peminjam wajib diisi');
      return;
    }
    if (!title.trim()) {
      setCreateError('Keterangan piutang wajib diisi');
      return;
    }

    try {
      await createReceivable({
        debtorName: debtorName.trim(),
        debtorContact: debtorContact.trim() || undefined,
        title: title.trim(),
        initialAmount,
        sourceFundingId: sourceFundingId || undefined,
        loanDate: loanDate ? new Date(loanDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      });

      setIsCreateOpen(false);
    } catch (err) {
      setCreateError(getErrorMessage(err));
    }
  };

  const handleOpenRepay = (rec: IReceivable) => {
    setRepayTarget(rec);
    setRepayAmountStr(String(rec.remainingAmount));
    setDestinationFundingId(fundingSources[0]?._id || '');
    setRepayNotes('');
    setRepayError(null);
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepayError(null);

    if (!repayTarget) return;

    const amount = parseInt(repayAmountStr.replace(/[^0-9]/g, ''), 10);
    if (!amount || amount <= 0) {
      setRepayError('Nominal pembayaran harus lebih dari 0');
      return;
    }
    if (amount > repayTarget.remainingAmount) {
      setRepayError(
        `Nominal pembayaran tidak boleh melebihi sisa piutang (${formatRupiah(
          repayTarget.remainingAmount
        )})`
      );
      return;
    }
    if (!destinationFundingId) {
      setRepayError('Pilih Sumber Dana Tujuan uang pelunasan');
      return;
    }

    try {
      await repayReceivable({
        id: repayTarget._id,
        dto: {
          amount,
          destinationFundingId,
          paidAt: new Date(),
          notes: repayNotes.trim() || undefined,
        },
      });

      setRepayTarget(null);
    } catch (err) {
      setRepayError(getErrorMessage(err));
    }
  };

  const totalActiveReceivables = dashboard?.summary?.totalActiveReceivables || 0;

  if (isLoading && !dashboard) {
    return <ReceivablesSkeleton />;
  }

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Header & Total Active Piutang Card */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">Manajemen Piutang</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Uang yang dipinjam oleh pihak lain.</p>
        </div>

        <Button
          size="sm"
          onClick={handleOpenCreate}
          className="text-xs h-8 px-2.5 font-semibold"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Catat Piutang
        </Button>
      </div>

      {/* Ringkasan Saldo Piutang (RCV-04) */}
      <Card className="p-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-2xl shadow-md shadow-amber-500/20 border-0">
        <div className="flex items-center justify-between text-amber-100 text-xs font-medium">
          <span>Total Piutang Aktif (Uang di Luar)</span>
          <HandCoins className="w-4 h-4 text-amber-200" />
        </div>
        <p className="text-2xl font-extrabold tracking-tight mt-1.5 tabular-nums">
          {hideBalance ? '••••••••' : formatRupiah(totalActiveReceivables)}
        </p>
        <p className="text-[11px] text-amber-100 mt-2">
          {receivables.length} catatan piutang belum tertagih lunas.
        </p>
      </Card>

      {/* Daftar Piutang */}
      <div className="space-y-3">
        {receivables.map((rec) => {
          const isPaid = rec.status === 'PAID';
          const isPartial = rec.status === 'PARTIAL';
          const pct = Math.min(
            100,
            Math.round((rec.paidAmount / rec.initialAmount) * 100)
          );

          return (
            <Card
              key={rec._id}
              className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{rec.debtorName}</h3>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">{rec.title}</p>
                  {rec.debtorContact && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{rec.debtorContact}</span>
                    </p>
                  )}
                </div>

                {/* Status Badge */}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    isPaid
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                      : isPartial
                      ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                      : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                  }`}
                >
                  {isPaid ? 'Lunas' : isPartial ? 'Dicicil' : 'Belum Bayar'}
                </span>
              </div>

              {/* Rincian Nominal */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Total Pinjaman</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {formatRupiah(rec.initialAmount)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Sisa Piutang</p>
                  <p className="font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                    {formatRupiah(rec.remainingAmount)}
                  </p>
                </div>
              </div>

              {/* Progress Bar Pelunasan */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                  <span>Terbayar: {formatRupiah(rec.paidAmount)}</span>
                  <span className="font-bold text-slate-600 dark:text-slate-400 tabular-nums">{pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              {/* Footer Tanggal & Tombol Pelunasan */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {rec.dueDate ? `Jatuh tempo: ${formatDate(rec.dueDate)}` : `Tanggal: ${formatDate(rec.loanDate)}`}
                </span>

                {!isPaid && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleOpenRepay(rec)}
                    className="text-xs h-7 px-2.5 font-bold bg-emerald-600 hover:bg-emerald-700"
                  >
                    Catat Pelunasan
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {receivables.length === 0 && (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <HandCoins className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Tidak Ada Piutang Aktif</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Catat pinjaman uang yang Anda berikan kepada pihak lain.
            </p>
            <Button size="sm" onClick={handleOpenCreate} className="mt-4 text-xs">
              + Catat Piutang
            </Button>
          </Card>
        )}
      </div>

      {/* Modal Form Catat Piutang Baru (RCV-02) */}
      <BottomSheet
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Catat Piutang Baru"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 pt-1">
          {createError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{createError}</span>
            </div>
          )}

          <Input
            label="Nama Peminjam"
            placeholder="Misal: Budi Santoso"
            value={debtorName}
            onChange={(e) => setDebtorName(e.target.value)}
            required
          />

          <Input
            label="Kontak / No. Telepon (Opsional)"
            placeholder="08123456789"
            value={debtorContact}
            onChange={(e) => setDebtorContact(e.target.value)}
          />

          <Input
            label="Keterangan / Keperluan"
            placeholder="Misal: Pinjam untuk biaya rumah sakit"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Piutang (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={
                  amountStr
                    ? new Intl.NumberFormat('id-ID').format(
                        parseInt(amountStr.replace(/[^0-9]/g, '') || '0', 10)
                      )
                    : ''
                }
                onChange={(e) => setAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600"
                required
              />
            </div>
          </div>

          <Select
            label="Sumber Dana Asal (Saldo Akan Berkurang)"
            placeholder="Tanpa Mengurangi Saldo"
            value={sourceFundingId}
            onChange={setSourceFundingId}
            options={[
              { value: '', label: 'Tanpa Mengurangi Saldo' },
              ...fundingSources.map((fs) => ({
                value: fs._id,
                label: fs.name,
                sublabel: `Saldo: ${formatRupiah(fs.currentBalance)}`,
                color: fs.color || '#2563EB',
              })),
            ]}
            emptyMessage="Belum ada Sumber Dana"
          />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tanggal Pinjam
              </label>
              <input
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Jatuh Tempo (Opsional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" isLoading={isCreating} className="w-full font-bold">
              Simpan Piutang
            </Button>
          </div>
        </form>
      </BottomSheet>

      {/* Modal Form Catat Pelunasan / Cicilan (RCV-03) */}
      <BottomSheet
        isOpen={!!repayTarget}
        onClose={() => setRepayTarget(null)}
        title={`Pelunasan — ${repayTarget?.debtorName}`}
      >
        <form onSubmit={handleRepaySubmit} className="space-y-4 pt-1">
          {repayError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
              <span>{repayError}</span>
            </div>
          )}

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
            <p className="text-slate-500">
              Sisa yang harus dibayar:{' '}
              <strong className="text-slate-900 font-bold tabular-nums">
                {formatRupiah(repayTarget?.remainingAmount || 0)}
              </strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nominal Pelunasan / Cicilan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={
                  repayAmountStr
                    ? new Intl.NumberFormat('id-ID').format(
                        parseInt(repayAmountStr.replace(/[^0-9]/g, '') || '0', 10)
                      )
                    : ''
                }
                onChange={(e) => setRepayAmountStr(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-600"
                required
              />
            </div>
          </div>

          <Select
            label="Sumber Dana Tujuan (Saldo Akan Bertambah)"
            placeholder="Pilih Sumber Dana Tujuan"
            value={destinationFundingId}
            onChange={setDestinationFundingId}
            options={fundingSources.map((fs) => ({
              value: fs._id,
              label: fs.name,
              sublabel: `Saldo: ${formatRupiah(fs.currentBalance)}`,
              color: fs.color || '#10B981',
            }))}
            emptyMessage="Belum ada Sumber Dana"
          />

          <Input
            label="Catatan Pelunasan (Opsional)"
            placeholder="Misal: Cicilan ke-1 via transfer BCA"
            value={repayNotes}
            onChange={(e) => setRepayNotes(e.target.value)}
          />

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isRepaying}
              className="w-full font-bold bg-emerald-600 hover:bg-emerald-700"
            >
              Catat Pembayaran Masuk
            </Button>
          </div>
        </form>
      </BottomSheet>
    </div>
  );
}
