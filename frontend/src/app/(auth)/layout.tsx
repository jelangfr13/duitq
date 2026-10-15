import React from 'react';
import Link from 'next/link';
import { Wallet } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md mx-auto">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Link
            href="/login"
            className="flex items-center gap-2.5 group transition-transform active:scale-95"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Wallet className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-slate-900 leading-none">
                Duit<span className="text-blue-600">Q</span>
              </span>
              <span className="text-[10px] font-medium text-slate-500 tracking-wider uppercase mt-1">
                Keuangan Pribadi
              </span>
            </div>
          </Link>
        </div>

        {/* Content Container */}
        {children}

        {/* Footer info */}
        <p className="mt-8 text-center text-xs text-slate-400">
          DuitQ &copy; 2026 &bull; Aplikasi Keuangan Pribadi Minimalis
        </p>
      </div>
    </div>
  );
}
