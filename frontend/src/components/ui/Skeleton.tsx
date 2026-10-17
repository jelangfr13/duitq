import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800/80 ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton khusus untuk Dashboard saat data sedang diambil
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4 animate-fade-in">
      {/* Top Header Skeleton */}
      <div className="flex items-center justify-between pt-1">
        <div className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="w-11 h-11 rounded-full" />
      </div>

      {/* Hero Balance Card Skeleton */}
      <div className="p-5 rounded-2xl bg-slate-200 dark:bg-slate-850 animate-pulse space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-3 w-32 bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="h-5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-48 bg-slate-300 dark:bg-slate-700" />
          <Skeleton className="w-7 h-7 rounded-xl bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="pt-3 border-t border-slate-300/40 dark:border-slate-700/40 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-16 bg-slate-300 dark:bg-slate-700" />
              <Skeleton className="h-4 w-20 bg-slate-300 dark:bg-slate-700" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg bg-slate-300 dark:bg-slate-700" />
            <div className="space-y-1">
              <Skeleton className="h-2 w-16 bg-slate-300 dark:bg-slate-700" />
              <Skeleton className="h-4 w-20 bg-slate-300 dark:bg-slate-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
        <Skeleton className="h-8 flex-1 rounded-xl" />
      </div>

      {/* Sumber Dana Card Skeleton */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-14" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </div>

      {/* Total Keseluruhan Aset Card Skeleton */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-6 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-20 w-full rounded-2xl" />
        <div className="flex justify-center py-2">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>

      {/* Cashflow Bar Chart Skeleton */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>

      {/* Transaksi Terakhir Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Halaman Histori Transaksi
 */
export function TransactionsSkeleton() {
  return (
    <div className="space-y-3 px-4 pt-4 animate-fade-in">
      <Skeleton className="h-6 w-36" />
      <Skeleton className="h-11 w-full rounded-2xl" />
      <div className="flex gap-2 overflow-hidden">
        <Skeleton className="h-8 w-20 shrink-0 rounded-xl" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-xl" />
        <Skeleton className="h-8 w-24 shrink-0 rounded-xl" />
        <Skeleton className="h-8 w-20 shrink-0 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-14 rounded-xl" />
        <Skeleton className="h-14 rounded-xl" />
      </div>
      <div className="space-y-2 pt-2">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Halaman Sumber Dana
 */
export function WalletsSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Halaman Budgeting
 */
export function BudgetsSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="space-y-3">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * Skeleton untuk Halaman Piutang
 */
export function ReceivablesSkeleton() {
  return (
    <div className="space-y-4 px-4 pt-4 animate-fade-in">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 rounded-2xl" />
        <Skeleton className="h-20 rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
