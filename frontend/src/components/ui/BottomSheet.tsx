'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 w-full max-w-md rounded-t-3xl bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 p-6 shadow-2xl transition-all duration-300 max-h-[90dvh] overflow-y-auto animate-in slide-in-from-bottom text-slate-900 dark:text-slate-100"
      >
        {/* Drag handle */}
        <div className="mx-auto -mt-2 mb-4 h-1.5 w-12 rounded-full bg-slate-200 dark:bg-slate-700" />

        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          {title && <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-auto cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
