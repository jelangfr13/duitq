'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  X,
  Users,
  KeyRound,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Wallet,
  ArrowRightLeft,
  Calendar,
  RefreshCw,
  Mail,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin, AdminUser } from '@/hooks/useAdmin';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';

export default function AdminPanelPage() {
  const router = useRouter();
  const { user: currentUser, isLoading: isAuthLoading } = useAuth();

  // Verifikasi apakah user saat ini adalah Developer Admin
  const isDevAdmin = Boolean(
    currentUser?.isDevAdmin ||
      (currentUser?.email &&
        process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL &&
        currentUser.email.toLowerCase().trim() ===
          process.env.NEXT_PUBLIC_DEV_ADMIN_EMAIL.toLowerCase().trim())
  );

  const [search, setSearch] = useState('');
  const {
    users,
    isLoading: isUsersLoading,
    isFetching,
    resetPassword,
    isResetting,
    deleteUser,
    isDeleting,
    refetch,
  } = useAdmin(search);

  // State Notifikasi Flash
  const [notification, setNotification] = useState<string | null>(null);

  // State Modal Reset Password
  const [resetTargetUser, setResetTargetUser] = useState<AdminUser | null>(null);
  const [customPassword, setCustomPassword] = useState('');
  const [resetResult, setResetResult] = useState<{
    email: string;
    mode: 'FORCE_RESET_ON_LOGIN' | 'CUSTOM_PASSWORD';
    newPassword?: string;
  } | null>(null);
  const [hasCopiedPassword, setHasCopiedPassword] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // State Modal Hapus User
  const [deleteTargetUser, setDeleteTargetUser] = useState<AdminUser | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // State Filter Tab Pengguna
  const [filterTab, setFilterTab] = useState<'ALL' | 'PENDING_RESET'>('ALL');

  // Ringkasan Statistik
  const stats = useMemo(() => {
    const totalUsers = users.length;
    const pendingResets = users.filter((u) => u.hasPendingResetRequest).length;
    const totalWallets = users.reduce((acc, u) => acc + (u.fundingSourcesCount || 0), 0);
    const totalTx = users.reduce((acc, u) => acc + (u.transactionsCount || 0), 0);
    return { totalUsers, pendingResets, totalWallets, totalTx };
  }, [users]);

  // Daftar Pengguna yang Ditampilkan
  const displayedUsers = useMemo(() => {
    if (filterTab === 'PENDING_RESET') {
      return users.filter((u) => u.hasPendingResetRequest);
    }
    return users;
  }, [users, filterTab]);

  // Handle Submit Reset Kata Sandi
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    setResetError(null);

    const isCustom = Boolean(customPassword.trim());

    try {
      const res = await resetPassword({
        userId: resetTargetUser.id,
        newPassword: isCustom ? customPassword.trim() : undefined,
      });

      const data = res?.data || res;
      const mode = data?.mode || (isCustom ? 'CUSTOM_PASSWORD' : 'FORCE_RESET_ON_LOGIN');
      const newPass = data?.newPassword;

      setResetResult({
        email: resetTargetUser.email,
        mode,
        newPassword: newPass,
      });
      setResetTargetUser(null);
      setCustomPassword('');

      if (mode === 'FORCE_RESET_ON_LOGIN') {
        showNotification(
          `Pengguna ${resetTargetUser.email} akan langsung diminta membuat kata sandi baru saat mencoba login.`
        );
      } else {
        showNotification(`Kata sandi akun ${resetTargetUser.email} berhasil direset!`);
      }
    } catch (err) {
      setResetError(getErrorMessage(err));
    }
  };

  // Handle Salin Kata Sandi ke Clipboard
  const handleCopyPassword = () => {
    if (resetResult?.newPassword) {
      navigator.clipboard.writeText(resetResult.newPassword);
      setHasCopiedPassword(true);
      setTimeout(() => setHasCopiedPassword(false), 2500);
    }
  };

  // Handle Hapus Pengguna
  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteTargetUser) return;
    setDeleteError(null);

    if (confirmText.trim() !== 'HAPUS') {
      setDeleteError('Ketik "HAPUS" untuk mengonfirmasi tindakan ini.');
      return;
    }

    try {
      await deleteUser(deleteTargetUser.id);
      showNotification(`Akun ${deleteTargetUser.email} telah berhasil dihapus secara permanen.`);
      setDeleteTargetUser(null);
      setConfirmText('');
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    }
  };

  // Proteksi Tampilan jika bukan Developer Admin
  if (isAuthLoading) {
    return (
      <div className="p-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Memverifikasi kredensial developer...</p>
      </div>
    );
  }

  if (!isDevAdmin) {
    return (
      <div className="space-y-4 px-4 pt-10 text-center">
        <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs space-y-4 max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Akses Dibatasi
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Halaman Admin Panel hanya dapat diakses oleh akun Developer terdaftar.
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => router.push('/settings')}
            className="w-full text-xs font-bold py-2.5"
          >
            Kembali ke Pengaturan
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 pt-3 pb-28 overflow-x-hidden max-w-full">
      {/* Toast Notifikasi */}
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-md p-3.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span className="flex-1">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-800 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar yang Rapi & Proporsional */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2.5">
          <Link
            href="/settings"
            className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs shrink-0 cursor-pointer"
            title="Kembali ke Pengaturan"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Admin Panel
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                <span>Dev Mode</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manajemen akun pengguna, reset sandi, & kontrol data
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs cursor-pointer transition-all shrink-0"
          title="Segarkan Data"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>

      {/* KPI Cards Ringkasan yang Kompak & Modern */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`p-2.5 rounded-xl border shadow-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            filterTab === 'ALL'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Pengguna</span>
          <span className="text-sm font-extrabold text-blue-600 dark:text-blue-400 mt-0.5 tabular-nums">
            {stats.totalUsers}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab(filterTab === 'PENDING_RESET' ? 'ALL' : 'PENDING_RESET')}
          className={`p-2.5 rounded-xl border shadow-xs flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            stats.pendingResets > 0
              ? filterTab === 'PENDING_RESET'
                ? 'bg-amber-100/90 dark:bg-amber-950/70 border-amber-400 dark:border-amber-600 ring-2 ring-amber-500/30'
                : 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-750 hover:bg-amber-100/60'
              : filterTab === 'PENDING_RESET'
              ? 'bg-amber-50/70 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
          }`}
        >
          <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
            <span>Butuh Reset</span>
            {stats.pendingResets > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-ping" />
            )}
          </span>
          <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 tabular-nums">
            {stats.pendingResets}
          </span>
        </button>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Total Dompet</span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {stats.totalWallets}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">Transaksi</span>
          <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400 mt-0.5 tabular-nums">
            {stats.totalTx}
          </span>
        </div>
      </div>

      {/* Search Bar Pengguna */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama atau email pengguna..."
          className="w-full h-10 pl-10 pr-10 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs transition-all"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Section List Pengguna */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-0.5 pt-0.5 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setFilterTab('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterTab === 'ALL'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Semua ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterTab('PENDING_RESET')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filterTab === 'PENDING_RESET'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : stats.pendingResets > 0
                  ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Butuh Reset</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                filterTab === 'PENDING_RESET' ? 'bg-amber-600 text-white' : 'bg-amber-200/70 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
              }`}>
                {stats.pendingResets}
              </span>
            </button>
          </div>

          {isFetching && (
            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium animate-pulse">
              Memperbarui data...
            </span>
          )}
        </div>

        {isUsersLoading ? (
          <div className="space-y-2.5">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl animate-pulse space-y-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded" />
                    <div className="h-2.5 w-1/2 bg-slate-100 dark:bg-slate-850 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedUsers.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tidak ada pengguna ditemukan
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filterTab === 'PENDING_RESET'
                ? 'Tidak ada akun yang sedang meminta reset kata sandi.'
                : search
                ? `Tidak ada akun yang cocok dengan kata kunci "${search}"`
                : 'Belum ada pengguna terdaftar di sistem.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {displayedUsers.map((u) => {
              const currentUserId = currentUser?._id;
              const isSelf =
                (currentUserId && u.id === currentUserId) ||
                (currentUser?.email && u.email.toLowerCase() === currentUser.email.toLowerCase());

              return (
                <div
                  key={u.id}
                  className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-xs space-y-3"
                >
                  {/* Info Header Pengguna */}
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    {u.avatarUrl ? (
                      <img
                        src={u.avatarUrl}
                        alt={u.fullName}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-900 font-bold text-sm flex items-center justify-center shrink-0">
                        {u.fullName?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {u.fullName}
                        </p>
                        {u.isDevAdmin && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                            Dev Admin
                          </span>
                        )}
                        {isSelf && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
                            Akun Anda
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{u.email}</span>
                      </p>
                    </div>
                  </div>

                  {/* Banner Peringatan Permintaan Reset Kata Sandi */}
                  {u.hasPendingResetRequest && (
                    <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-850 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1 flex-wrap">
                          <span className="font-bold text-[11px] text-amber-900 dark:text-amber-200">
                            🔔 Meminta Reset Kata Sandi
                          </span>
                          {u.resetRequestedAt && (
                            <span className="text-[10px] text-amber-700/90 dark:text-amber-400">
                              {formatDate(u.resetRequestedAt)}
                            </span>
                          )}
                        </div>
                        {u.resetRequestNote ? (
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 italic bg-amber-100/60 dark:bg-amber-900/40 p-1.5 rounded-lg">
                            &ldquo;{u.resetRequestNote}&rdquo;
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-700/80 dark:text-amber-400 mt-0.5">
                            Pengguna meminta bantuan reset dari halaman Lupa Kata Sandi.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Metadata & Statistik Akun */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1 text-[10px]">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      <span>Bergabung: {formatDate(u.createdAt)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] font-medium">
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <Wallet className="w-3 h-3 text-emerald-500" />
                        <span>{u.fundingSourcesCount} Dompet</span>
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">&bull;</span>
                      <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                        <ArrowRightLeft className="w-3 h-3 text-blue-500" />
                        <span>{u.transactionsCount} Tx</span>
                      </span>
                    </div>
                  </div>

                  {/* Tombol Aksi Kontrol Admin: Reset Sandi & Hapus Akun (Warna Danger) */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    {/* Tombol Reset Sandi */}
                    <button
                      type="button"
                      onClick={() => {
                        setResetTargetUser(u);
                        setCustomPassword('');
                        setResetError(null);
                      }}
                      className={`h-9 px-3 rounded-xl border font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-[0.98] ${
                        u.hasPendingResetRequest
                          ? 'border-amber-500 bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <KeyRound
                        className={`w-3.5 h-3.5 shrink-0 ${
                          u.hasPendingResetRequest
                            ? 'text-white'
                            : 'text-blue-600 dark:text-blue-400'
                        }`}
                      />
                      <span>
                        {u.hasPendingResetRequest ? 'Proses Reset' : 'Reset Sandi'}
                      </span>
                    </button>

                    {/* Tombol Hapus Akun (Warna Merah / Danger Terang & Jelas) */}
                    {u.isDevAdmin || isSelf ? (
                      <button
                        type="button"
                        disabled
                        className="h-9 px-3 rounded-xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 font-semibold text-xs flex items-center justify-center gap-1.5 cursor-not-allowed opacity-60"
                        title={
                          u.isDevAdmin
                            ? 'Akun Developer Utama tidak dapat dihapus'
                            : 'Akun Anda sendiri'
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-600" />
                        <span>Hapus Akun</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTargetUser(u);
                          setConfirmText('');
                          setDeleteError(null);
                        }}
                        className="h-9 px-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 hover:border-rose-600 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-[0.98] group"
                      >
                        <Trash2 className="w-3.5 h-3.5 shrink-0 text-rose-600 dark:text-rose-400 group-hover:text-white transition-colors" />
                        <span>Hapus Akun</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: Form Reset Kata Sandi */}
      <BottomSheet
        isOpen={!!resetTargetUser}
        onClose={() => setResetTargetUser(null)}
        title="Reset Kata Sandi Pengguna"
      >
        {resetTargetUser && (
          <form onSubmit={handleResetSubmit} className="space-y-4 pt-1 pb-6">
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
              <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-bold text-[11px]">Target Pengguna:</p>
                <p className="text-[11px]">
                  <strong>{resetTargetUser.fullName}</strong> ({resetTargetUser.email})
                </p>
              </div>
            </div>

            {resetTargetUser.hasPendingResetRequest && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-[11px]">Akun Memiliki Permintaan Reset Aktif</p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                    Mereset akun ini akan otomatis membersihkan status permintaan reset. Pengguna dapat login kembali dengan kata sandi baru.
                  </p>
                </div>
              </div>
            )}

            {resetError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{resetError}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Kata Sandi Baru (Opsional)
              </label>
              <Input
                type="text"
                placeholder="Kosongkan agar user buat sandi baru saat login"
                value={customPassword}
                onChange={(e) => setCustomPassword(e.target.value)}
                className="text-xs"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                💡 <strong>Catatan:</strong> Jika kotak ini <strong>dikosongkan</strong>, ketika pengguna mencoba login kembali, mereka akan <strong>langsung diminta memasukkan kata sandi baru</strong>.
              </p>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                isLoading={isResetting}
                className="w-full font-bold py-3 text-xs shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Reset Kata Sandi Sekarang
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>

      {/* MODAL 2: Hasil Reset Kata Sandi */}
      <BottomSheet
        isOpen={!!resetResult}
        onClose={() => setResetResult(null)}
        title="Status Reset Kata Sandi"
      >
        {resetResult && (
          <div className="space-y-4 pt-1 pb-6">
            {resetResult.mode === 'FORCE_RESET_ON_LOGIN' ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-900 dark:text-blue-300">
                  <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Reset Pada Saat Login Aktif</p>
                    <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-1 leading-relaxed">
                      Kotak kata sandi dikosongkan. Ketika <strong>{resetResult.email}</strong> mencoba masuk ke akun kembali, sistem akan <strong>langsung meminta mereka untuk membuat kata sandi baru</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs">
                  <p className="text-[11px] leading-relaxed">
                    Pengguna tidak memerlukan kata sandi lama maupun kata sandi sementara. Mereka cukup mengetik emailnya di halaman Masuk untuk langsung diarahkan membuat kata sandi baru.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-xs">Kata Sandi Kustom Berhasil Diset</p>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Berikan kata sandi baru berikut kepada pengguna terkait (<strong>{resetResult.email}</strong>):
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Kata Sandi Baru:
                  </label>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100 flex-1 select-all break-all">
                      {resetResult.newPassword}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs shrink-0"
                    >
                      {hasCopiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Tersalin</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Salin</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="primary"
                onClick={() => setResetResult(null)}
                className="w-full font-bold py-3 text-xs cursor-pointer"
              >
                Selesai
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* MODAL 3: Konfirmasi Hapus Akun Pengguna (Warna Merah / Danger) */}
      <BottomSheet
        isOpen={!!deleteTargetUser}
        onClose={() => setDeleteTargetUser(null)}
        title="Hapus Akun Pengguna Permanen"
      >
        {deleteTargetUser && (
          <form onSubmit={handleDeleteSubmit} className="space-y-4 pt-1 pb-6">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2.5 text-xs text-rose-900 dark:text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Peringatan Tindakan Destruktif</p>
                <p className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5 leading-relaxed">
                  Menghapus akun <strong>{deleteTargetUser.fullName}</strong> ({deleteTargetUser.email}) akan menghapus <strong>seluruh data sumber dana, mutasi transaksi, pos anggaran, dan riwayat keuangannya secara permanen</strong>.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ketik kata <span className="text-rose-600 dark:text-rose-400 font-bold">HAPUS</span> di bawah ini untuk konfirmasi:
              </label>
              <Input
                type="text"
                placeholder="Ketik HAPUS"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="text-xs"
                required
              />
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTargetUser(null)}
                className="flex-1 text-xs py-2.5 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={isDeleting}
                disabled={confirmText.trim() !== 'HAPUS'}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2.5 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Hapus Akun Sekarang
              </Button>
            </div>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
