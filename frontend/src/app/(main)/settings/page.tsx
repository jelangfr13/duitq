'use client';

import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Eye,
  HandCoins,
  LogOut,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useReceivables } from '@/hooks/useReceivables';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';

export default function SettingsPage() {
  const { user, logoutMutation } = useAuth();
  const { updatePreferences, isUpdatingPreferences } = useReceivables();
  const { hideBalance, toggleHideBalance } = useAppStore();

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isReceivablesEnabled = user?.preferences?.enableReceivablesModule ?? true;

  const handleToggleReceivables = async () => {
    setError(null);
    setNotification(null);
    try {
      await updatePreferences({
        enableReceivablesModule: !isReceivablesEnabled,
      });
      setNotification(
        !isReceivablesEnabled
          ? 'Modul Piutang telah diaktifkan di navigasi bawah.'
          : 'Modul Piutang telah dinonaktifkan untuk tampilan lebih minimalis.'
      );
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar dari akun DuitQ Anda?')) {
      await logoutMutation.mutateAsync();
    }
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 tracking-tight">Pengaturan Akun</h1>
        <p className="text-[11px] text-slate-500">Kelola preferensi dan keamanan akun DuitQ Anda.</p>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-2 text-emerald-800 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Profil Pengguna */}
      <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg border border-blue-100">
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-bold text-slate-900 truncate">
              {user?.fullName || 'Pengguna DuitQ'}
            </h2>
            <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <Mail className="w-3 h-3 text-slate-400" />
              {user?.email || '-'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Terdaftar sejak
          </span>
          <span className="font-medium text-slate-600">
            {user?.createdAt ? formatDate(user.createdAt) : 'Aktif'}
          </span>
        </div>
      </Card>

      {/* Preferensi Fitur Keuangan (RCV-01) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
          Modul & Fitur Opsional
        </h3>

        <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-4">
          {/* Sakelar Modul Piutang (RCV-01) */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5">
                <HandCoins className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Modul Manajemen Piutang</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Menampilkan tab & pencatatan piutang yang tersinkronisasi langsung ke Sumber Dana.
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={isReceivablesEnabled}
              disabled={isUpdatingPreferences}
              onClick={handleToggleReceivables}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isReceivablesEnabled ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  isReceivablesEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-start justify-between gap-3">
            {/* Toggle Privasi Saldo */}
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                <Eye className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Mode Privasi Saldo</p>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Sembunyikan nominal Rupiah pada layar utama agar aman dari pandangan publik.
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={hideBalance}
              onClick={toggleHideBalance}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                hideBalance ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  hideBalance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </Card>
      </div>

      {/* Informasi Sistem & Keamanan */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider px-1">
          Sistem & Keamanan
        </h3>

        <Card className="p-4 bg-white border border-slate-100 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Mata Uang Basis</span>
            <span className="font-bold text-slate-900">IDR (Rupiah Indonesia)</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Integritas Transaksi</span>
            <span className="font-bold text-emerald-600">MongoDB ACID Active</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
            <span className="text-slate-500">Versi Web App</span>
            <span className="text-slate-600 font-mono">1.0.0 (PWA Ready)</span>
          </div>
        </Card>
      </div>

      {/* Tombol Keluar Akun (AUTH-05) */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          isLoading={logoutMutation.isPending}
          className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 font-bold py-3"
          leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
        >
          Keluar dari Akun
        </Button>
      </div>
    </div>
  );
}
