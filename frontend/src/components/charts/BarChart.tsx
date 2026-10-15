'use client';

import React, { useState, useEffect } from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { CashFlowTrendItem } from '@shared/types/dashboard';
import { formatCompactRupiah, formatRupiah } from '@/lib/format';
import { BarChart3 } from 'lucide-react';

interface BarChartProps {
  data: CashFlowTrendItem[];
}

export function BarChart({ data }: BarChartProps) {
  const [mounted, setMounted] = useState(false);

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

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-52 bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 p-4 text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
          <BarChart3 className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Belum Ada Transaksi di Periode Ini</p>
        <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
          Catat uang masuk atau uang keluar untuk melihat tren perbandingan arus kas.
        </p>
      </div>
    );
  }

  // Format label tanggal ringkas (misal "15 Okt" atau "15/10")
  const formattedData = data.map((item) => {
    const parts = item.date.split('-');
    const label = parts.length === 3 ? `${parseInt(parts[2], 10)}/${parseInt(parts[1], 10)}` : item.date;
    return {
      ...item,
      label,
    };
  });

  return (
    <div className="space-y-2">
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsBarChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 10, fill: '#64748B' }}
              tickFormatter={(v) => formatCompactRupiah(v)}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const inc = payload.find((p) => p.dataKey === 'income')?.value as number || 0;
                  const exp = payload.find((p) => p.dataKey === 'expense')?.value as number || 0;
                  return (
                    <div className="rounded-xl bg-slate-900 px-3 py-2 text-white shadow-lg text-xs space-y-1">
                      <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-emerald-400">Masuk:</span>
                        <span className="font-bold tabular-nums">{formatRupiah(inc)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-rose-400">Keluar:</span>
                        <span className="font-bold tabular-nums">{formatRupiah(exp)}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
              formatter={(value) => (
                <span className="text-slate-600 font-medium">
                  {value === 'income' ? 'Uang Masuk' : 'Uang Keluar'}
                </span>
              )}
            />
            <Bar
              dataKey="income"
              name="income"
              fill="#10B981"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
            <Bar
              dataKey="expense"
              name="expense"
              fill="#F43F5E"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            />
          </RechartsBarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
