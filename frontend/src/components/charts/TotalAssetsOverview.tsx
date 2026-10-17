'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Landmark,
  Wallet,
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  HandCoins,
  ArrowRight,
  Layers,
} from 'lucide-react';
import { IFundingSource } from '@shared/types/funding-source';
import { BudgetDistribution } from '@shared/types/dashboard';
import { formatCompactRupiah, formatRupiah } from '@/lib/format';

interface TotalAssetsOverviewProps {
  summary?: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    totalActiveReceivables?: number;
    totalBudgetAllocated?: number;
    totalBudgetSpent?: number;
    totalBudgetRemaining?: number;
  };
  fundingSources?: IFundingSource[];
  budgets?: BudgetDistribution[];
  isReceivablesEnabled?: boolean;
  hideBalance?: boolean;
  themeColor?: string;
}

export function TotalAssetsOverview({
  summary = {
    totalBalance: 0,
    totalIncome: 0,
    totalExpense: 0,
    netCashFlow: 0,
    totalActiveReceivables: 0,
    totalBudgetAllocated: 0,
    totalBudgetSpent: 0,
    totalBudgetRemaining: 0,
  },
  fundingSources = [],
  budgets = [],
  isReceivablesEnabled = false,
  hideBalance = false,
  themeColor = '#2563EB',
}: TotalAssetsOverviewProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'assets' | 'budget'>('assets');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-72 w-full flex items-center justify-center bg-slate-50/50 dark:bg-slate-800/40 rounded-2xl animate-pulse">
        <span className="text-xs text-slate-400 dark:text-slate-500">Memuat ikhtisar aset...</span>
      </div>
    );
  }

  // Hitung total nilai aset (Saldo Kas + Piutang Aktif jika ada)
  const activeReceivablesAmount = isReceivablesEnabled ? (summary.totalActiveReceivables || 0) : 0;
  const totalNetAssets = (summary.totalBalance || 0) + activeReceivablesAmount;
  const netCashFlow = summary.netCashFlow ?? ((summary.totalIncome || 0) - (summary.totalExpense || 0));

  // Siapkan data chart sesuai tab aktif
  let chartData: Array<{
    name: string;
    value: number;
    color: string;
    subtext?: string;
    extra?: string;
  }> = [];

  if (activeTab === 'assets') {
    // Tab 1: Komposisi Saldo per Sumber Dana (+ Piutang jika ada)
    chartData = fundingSources
      .filter((fs) => (fs.currentBalance || 0) > 0)
      .map((fs) => ({
        name: fs.name,
        value: fs.currentBalance,
        color: fs.color || themeColor,
        subtext: fs.type,
      }));

    if (activeReceivablesAmount > 0) {
      chartData.push({
        name: 'Piutang Aktif',
        value: activeReceivablesAmount,
        color: '#F59E0B',
        subtext: 'Piutang Belum Lunas',
      });
    }
  } else {
    // Tab 2: Komposisi Alokasi Budgeting
    chartData = budgets
      .filter((b) => (b.amount || 0) > 0)
      .map((b) => ({
        name: b.name,
        value: b.amount,
        color: b.color || '#6366F1',
        subtext: b.fundingSourceName,
        extra: `Sisa: ${formatRupiah(b.remainingAmount)}`,
      }));
  }

  const chartTotal = chartData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-3.5">
      {/* 1. Header Ringkasan Aset & Switch Tab */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Landmark className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Total Keseluruhan Aset
          </h2>
        </div>

        {/* Tab Navigasi: Komposisi Aset vs Alokasi Budgeting */}
        <div className="flex p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('assets')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Komposisi Aset
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('budget')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
              activeTab === 'budget'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            Budgeting
          </button>
        </div>
      </div>

      {/* 2. Hero Banner: Total Nilai Bersih Aset & Status Arus Kas */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-800 dark:via-slate-800 dark:to-slate-900 text-white shadow-sm border border-slate-800/80">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-medium text-slate-300 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Total Estimasi Kekayaan Bersih
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              netCashFlow >= 0
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
            }`}
          >
            {netCashFlow >= 0 ? '+' : ''}
            {hideBalance ? '••••••' : formatRupiah(netCashFlow)} Kas Bersih
          </span>
        </div>

        <div className="mt-2 flex items-baseline justify-between">
          <p className="text-2xl font-black tracking-tight tabular-nums text-white">
            {hideBalance ? 'Rp ••••••••' : formatRupiah(totalNetAssets)}
          </p>
          <span className="text-[10px] text-slate-300 font-medium">
            {activeReceivablesAmount > 0 ? 'Saldo Kas + Piutang' : 'Total Saldo Kas'}
          </span>
        </div>
      </div>

      {/* 3. Donut Visual Chart dengan Center Value */}
      {chartData.length > 0 && chartTotal > 0 ? (
        <div className="relative py-1">
          <div className="h-52 w-full relative">
            {/* Center Label Donut */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                {activeTab === 'assets' ? 'Total Saldo' : 'Plafon Budget'}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-slate-100 tabular-nums">
                {hideBalance ? '••••••••' : formatCompactRupiah(chartTotal)}
              </span>
            </div>

            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const pct = chartTotal > 0 ? ((data.value / chartTotal) * 100).toFixed(1) : '0';
                      return (
                        <div className="rounded-xl bg-slate-900/95 dark:bg-slate-800/95 border border-slate-700 px-3 py-2 text-white shadow-xl text-xs backdrop-blur-xs">
                          <p className="font-bold flex items-center gap-1.5">
                            <span
                              className="w-2 h-2 rounded-full inline-block"
                              style={{ backgroundColor: data.color }}
                            />
                            {data.name}
                          </p>
                          <p className="text-emerald-400 tabular-nums font-extrabold mt-0.5">
                            {hideBalance ? 'Rp ••••••' : formatRupiah(data.value)} ({pct}%)
                          </p>
                          {data.extra && (
                            <p className="text-[10px] text-slate-400 mt-0.5">{data.extra}</p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={56}
                  outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend Grid Items */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            {chartData.map((item, idx) => {
              const pct = chartTotal > 0 ? ((item.value / chartTotal) * 100).toFixed(0) : '0';
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/60 dark:border-slate-800/60"
                >
                  <div className="flex items-center gap-1.5 min-w-0 pr-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="truncate text-slate-700 dark:text-slate-300 font-medium text-[11px]">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-[11px] font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                      {hideBalance ? '••••' : `${pct}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-44 bg-slate-50/60 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-4 text-center my-1">
          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
            {activeTab === 'assets' ? (
              <Wallet className="w-4 h-4" />
            ) : (
              <PieChartIcon className="w-4 h-4" />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            {activeTab === 'assets' ? 'Belum Ada Saldo Terisi' : 'Belum Ada Alokasi Budget'}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 max-w-xs">
            {activeTab === 'assets'
              ? 'Isi saldo pada sumber dana Anda untuk melihat proporsi kekayaan.'
              : 'Buat pos anggaran di menu Budgeting untuk mengontrol belanja.'}
          </p>
          {activeTab === 'budget' && (
            <Link
              href="/budgets"
              style={{ color: themeColor }}
              className="mt-2 text-xs font-bold hover:underline inline-flex items-center gap-1"
            >
              Kelola Pos Budget <ArrowRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      )}

      {/* 4. Grid 4/5 Metrik Utama Finansial (Saldo, Pemasukan, Pengeluaran, Budgeting, Piutang) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
          Rincian Pilar Finansial
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Total Saldo Kas */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 mb-1 text-slate-600 dark:text-slate-400">
              <Wallet className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[11px] font-semibold">Total Saldo</span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
              {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalBalance || 0)}
            </p>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
              {fundingSources.length} Dompet aktif
            </p>
          </div>

          {/* 2. Total Pemasukan */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
            <div className="flex items-center gap-1.5 mb-1 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Pemasukan</span>
            </div>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {hideBalance ? 'Rp ••••••' : `+${formatRupiah(summary.totalIncome || 0)}`}
            </p>
            <p className="text-[10px] text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
              Periode ini
            </p>
          </div>

          {/* 3. Total Pengeluaran */}
          <div className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-1.5 mb-1 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Pengeluaran</span>
            </div>
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {hideBalance ? 'Rp ••••••' : `-${formatRupiah(summary.totalExpense || 0)}`}
            </p>
            <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 mt-0.5">
              Periode ini
            </p>
          </div>

          {/* 4. Alokasi Budgeting */}
          <div className="p-3 rounded-xl bg-violet-50/60 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
            <div className="flex items-center gap-1.5 mb-1 text-violet-600 dark:text-violet-400">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[11px] font-semibold">Budgeting</span>
            </div>
            <p className="text-sm font-bold text-violet-700 dark:text-violet-300 tabular-nums">
              {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalBudgetAllocated || 0)}
            </p>
            <p className="text-[10px] text-violet-600/70 dark:text-violet-400/70 mt-0.5 truncate">
              Sisa: {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalBudgetRemaining ?? Math.max(0, (summary.totalBudgetAllocated || 0) - (summary.totalBudgetSpent || 0)))}
            </p>
          </div>

          {/* 5. Piutang Tertagih (jika modul piutang aktif atau ada piutang) */}
          {isReceivablesEnabled && (
            <div className="col-span-2 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5 text-amber-700 dark:text-amber-400">
                  <HandCoins className="w-3.5 h-3.5" />
                  <span className="text-[11px] font-semibold">Piutang Aktif</span>
                </div>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Uang yang sedang dipinjamkan & belum lunas
                </p>
              </div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 tabular-nums text-right">
                {hideBalance ? 'Rp ••••••' : formatRupiah(summary.totalActiveReceivables || 0)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
