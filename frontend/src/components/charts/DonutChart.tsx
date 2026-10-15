'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { StorageSpaceDistribution } from '@shared/types/dashboard';
import { formatRupiah } from '@/lib/format';
import { PieChart as PieChartIcon } from 'lucide-react';

interface DonutChartProps {
  spaces: StorageSpaceDistribution[];
}

export function DonutChart({ spaces }: DonutChartProps) {
  const [mounted, setMounted] = useState(false);
  const [activeMetric, setActiveMetric] = useState<'expense' | 'balance'>('expense');

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-slate-50/50 rounded-2xl animate-pulse">
        <span className="text-xs text-slate-400">Memuat grafik...</span>
      </div>
    );
  }

  // Siapkan data berdasarkan metrik terpilih
  const chartData = spaces
    .map((s) => ({
      name: s.name,
      value: activeMetric === 'expense' ? s.periodExpense || s.totalOut : Math.max(0, s.currentBalance),
      color: s.color || '#3B82F6',
      icon: s.icon,
    }))
    .filter((d) => d.value > 0);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);

  if (spaces.length === 0 || totalValue === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <PieChartIcon className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Belum Ada Data Ruang Penyimpanan</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
          Catat pengeluaran atau alokasikan dana ke ruang penyimpanan untuk melihat grafik proporsi.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tab toggle metrik: Pengeluaran vs Sisa Saldo */}
      <div className="flex items-center justify-between">
        <div className="flex p-0.5 bg-slate-100 rounded-lg text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveMetric('expense')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeMetric === 'expense'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Pengeluaran
          </button>
          <button
            type="button"
            onClick={() => setActiveMetric('balance')}
            className={`px-2.5 py-1 rounded-md transition-all ${
              activeMetric === 'balance'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sisa Saldo
          </button>
        </div>
        <span className="text-[11px] font-medium text-slate-400 tabular-nums">
          Total: <strong className="text-slate-700 font-bold">{formatRupiah(totalValue)}</strong>
        </span>
      </div>

      {/* Donut Chart Container */}
      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const pct = totalValue > 0 ? ((data.value / totalValue) * 100).toFixed(1) : '0';
                  return (
                    <div className="rounded-xl bg-slate-900 px-3 py-2 text-white shadow-lg text-xs">
                      <p className="font-semibold">{data.name}</p>
                      <p className="text-emerald-400 tabular-nums font-bold mt-0.5">
                        {formatRupiah(data.value)} ({pct}%)
                      </p>
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
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend list */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
        {chartData.map((item, idx) => {
          const pct = ((item.value / totalValue) * 100).toFixed(0);
          return (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-slate-600 flex-1">{item.name}</span>
              <span className="text-[11px] font-bold text-slate-800 tabular-nums shrink-0">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
