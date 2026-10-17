'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Mail,
  Moon,
  Sun,
  Palette,
  Pipette,
  Camera,
  Trash2,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Calendar,
  HandCoins,
  ChevronRight,
  Eye,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme, THEME_COLOR_PRESETS } from '@/components/theme/ThemeProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { formatDate } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';

// Koleksi Avatar Preset SVG yang elegan & mandiri (100% offline)
const PRESET_AVATARS = [
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%232563EB"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23059669"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%237C3AED"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23E11D48"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%23D97706"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="%234F46E5"/><circle cx="50" cy="40" r="18" fill="%23FFFFFF"/><path d="M22 84c0-18 13-30 28-30s28 12 28 30" fill="%23FFFFFF"/></svg>',
];

export default function SettingsPage() {
  const {
    user,
    logoutMutation,
    updateProfile,
    isUpdatingProfile,
    deleteAccount,
    isDeletingAccount,
  } = useAuth();
  const { darkMode, toggleDarkMode, themeColor, setThemeColor } = useTheme();

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Modal dialog untuk Mode Tampilan & Tema Warna
  const [isThemeModeModalOpen, setIsThemeModeModalOpen] = useState(false);
  const [isThemeColorModalOpen, setIsThemeColorModalOpen] = useState(false);
  const [customColorInput, setCustomColorInput] = useState(themeColor || '#2563EB');

  useEffect(() => {
    if (themeColor) {
      setCustomColorInput(themeColor);
    }
  }, [themeColor]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setError(null);
    setTimeout(() => setNotification(null), 3500);
  };

  const getInitials = (name?: string) => {
    if (!name) return 'DQ';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  };

  // 1. Center crop & compress image via HTML5 Canvas (256x256, JPEG 0.8)
  const processImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            return reject(new Error('Canvas tidak didukung oleh browser ini'));
          }

          // Center crop bujursangkar
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, 256, 256);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Gagal membaca format gambar'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Gagal mengunggah file'));
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar yang valid');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const compressedBase64 = await processImageFile(file);
      await updateProfile({ avatarUrl: compressedBase64 });
      setIsPhotoModalOpen(false);
      showNotification('Foto profil berhasil diperbarui');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSelectPreset = async (avatarUrl: string) => {
    setIsUploading(true);
    setError(null);
    try {
      await updateProfile({ avatarUrl });
      setIsPhotoModalOpen(false);
      showNotification('Avatar profil berhasil diubah');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    setIsUploading(true);
    setError(null);
    try {
      await updateProfile({ avatarUrl: null });
      setIsPhotoModalOpen(false);
      showNotification('Foto profil berhasil dihapus');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsUploading(false);
    }
  };

  // 2. Pilih Mode Tampilan (Terang / Gelap)
  const handleSelectThemeMode = async (dark: boolean) => {
    if (dark === darkMode) {
      setIsThemeModeModalOpen(false);
      return;
    }
    toggleDarkMode();
    setIsThemeModeModalOpen(false);
    try {
      await updateProfile({ darkMode: dark, preferences: { darkMode: dark } });
      showNotification(dark ? 'Mode Gelap berhasil diaktifkan' : 'Mode Terang berhasil diaktifkan');
    } catch (err) {
      toggleDarkMode();
      setError(getErrorMessage(err));
    }
  };

  // 3. Ubah Tema Warna
  const handleSelectThemeColor = async (colorVal: string) => {
    setThemeColor(colorVal);
    try {
      await updateProfile({ themeColor: colorVal, preferences: { themeColor: colorVal } });
      showNotification('Tema warna aplikasi berhasil disesuaikan');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleLogout = async () => {
    if (confirm('Yakin ingin keluar dari akun DuitQ Anda?')) {
      await logoutMutation.mutateAsync();
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal menghapus akun. Silakan coba lagi.');
      setIsDeleteAccountModalOpen(false);
    }
  };

  return (
    <div className="space-y-4 px-4 pt-4">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          Pengaturan Akun
        </h1>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Kustomisasi tampilan, foto profil, dan preferensi aplikasi DuitQ Anda.
        </p>
      </div>

      {notification && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-800 flex items-start gap-2 text-emerald-800 dark:text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-800 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Kartu Profil Interaktif (Update v1.2) */}
      <Card className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          {/* Avatar Preview Besar */}
          <div className="relative group">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'User'}
                loading="lazy"
                className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 dark:border-slate-800 shadow-md transition-transform group-hover:scale-102"
              />
            ) : (
              <div
                style={{ backgroundColor: themeColor }}
                className="w-20 h-20 rounded-full text-white font-extrabold text-2xl flex items-center justify-center border-4 border-slate-100 dark:border-slate-800 shadow-md tracking-wider transition-transform group-hover:scale-102"
              >
                {getInitials(user?.fullName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsPhotoModalOpen(true)}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md hover:scale-110 active:scale-95 transition-all cursor-pointer"
              title="Ubah Foto Profil"
              aria-label="Ubah Foto Profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Info Akun & Tombol Ubah */}
          <div className="min-w-0 flex-1 space-y-1">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">
              {user?.fullName || 'Pengguna DuitQ'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center justify-center sm:justify-start gap-1">
              <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0" />
              <span>{user?.email || '-'}</span>
            </p>
            <div className="pt-1.5 flex items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => setIsPhotoModalOpen(true)}
                style={{ borderColor: themeColor, color: themeColor }}
                className="px-3 py-1 rounded-lg border text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ubah Foto
              </button>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            Akun Terdaftar Sejak
          </span>
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {user?.createdAt ? formatDate(user.createdAt) : 'Aktif'}
          </span>
        </div>
      </Card>

      {/* 2. Tampilan & Personalisasi (Dark Mode & Tema Warna - Update v1.2) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
          Tampilan & Personalisasi
        </h3>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          {/* Sub Menu Mode Tampilan (Terang / Gelap) */}
          <button
            type="button"
            onClick={() => setIsThemeModeModalOpen(true)}
            className="w-full flex items-center justify-between p-1.5 -m-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                {darkMode ? <Moon className="w-5 h-5 stroke-[2.2]" /> : <Sun className="w-5 h-5 stroke-[2.2]" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    Mode Tampilan
                  </p>
                  <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300">
                    {darkMode ? 'Mode Gelap' : 'Mode Terang'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Pilih tema terang atau gelap untuk kenyamanan mata.
                </p>
              </div>
            </div>

            <div className="flex items-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors pl-2">
              <ChevronRight className="w-5 h-5 stroke-[2]" />
            </div>
          </button>

          {/* Sub Menu Tema Warna Aplikasi */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsThemeColorModalOpen(true)}
              className="w-full flex items-center justify-between p-1.5 -m-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Tema Warna Aplikasi
                    </p>
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-white dark:border-slate-700 shadow-xs inline-block"
                      style={{ backgroundColor: themeColor }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                    Kustomisasi warna aksen utama atau gunakan pemilih warna kustom.
                  </p>
                </div>
              </div>

              <div className="flex items-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors pl-2">
                <ChevronRight className="w-5 h-5 stroke-[2]" />
              </div>
            </button>
          </div>
        </Card>
      </div>

      {/* 3. Preferensi Fitur Keuangan */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
          Preferensi Fitur
        </h3>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs">
          {/* Sub Menu Modul Piutang (Update v1.2) */}
          <Link
            href="/receivables"
            className="flex items-center justify-between p-1.5 -m-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <HandCoins className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Modul Manajemen Piutang
                  </p>
                  <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                    Buka
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Pencatatan pinjaman uang pihak lain, jatuh tempo, dan pelunasan.
                </p>
              </div>
            </div>

            <div className="flex items-center text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors pl-2">
              <ChevronRight className="w-5 h-5 stroke-[2]" />
            </div>
          </Link>
        </Card>
      </div>

      {/* 4. Informasi Aplikasi */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider px-1">
          Informasi
        </h3>

        <Card className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Mata Uang Basis</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">IDR (Rupiah Indonesia)</span>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">Versi Aplikasi</span>
            <span className="text-slate-600 dark:text-slate-400 font-mono font-medium">v1.2.0</span>
          </div>
        </Card>
      </div>

      {/* 5. Tombol Keluar Akun & Hapus Akun */}
      <div className="pt-2">
        <Button
          variant="outline"
          onClick={handleLogout}
          isLoading={logoutMutation.isPending}
          className="w-full text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold py-3 cursor-pointer"
          leftIcon={<LogOut className="w-4 h-4 text-rose-600 dark:text-rose-400" />}
        >
          Keluar dari Akun
        </Button>

        {/* Text Button: Hapus Akun */}
        <div className="pt-3 pb-2 text-center">
          <button
            type="button"
            onClick={() => setIsDeleteAccountModalOpen(true)}
            className="text-xs font-semibold text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors py-1.5 px-3 rounded-lg cursor-pointer inline-flex items-center gap-1.5"
          >
            Hapus Akun
          </button>
        </div>
      </div>

      {/* Modal BottomSheet: Ubah Foto Profil */}
      <BottomSheet
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        title="Ubah Foto Profil"
      >
        <div className="space-y-5 pb-2">
          {/* Input file tersembunyi */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Opsi 1: Unggah dari Perangkat */}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">Unggah Gambar</p>
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="w-full p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50 dark:bg-slate-850 flex items-center justify-center gap-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <span>{isUploading ? 'Memproses...' : 'Pilih Foto dari Galeri / Kamera'}</span>
            </button>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              Foto akan otomatis dipotong bujursangkar & dikompresi ringan (&lt; 40KB).
            </p>
          </div>

          {/* Opsi 2: Pilih Avatar Preset Siap Pakai */}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">Atau Gunakan Avatar Preset</p>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_AVATARS.map((svgUri, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isUploading}
                  onClick={() => handleSelectPreset(svgUri)}
                  className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer"
                >
                  <img src={svgUri} alt={`Preset ${idx + 1}`} loading="lazy" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Opsi 3: Hapus Foto Profil (kembali ke inisial) */}
          {user?.avatarUrl && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isUploading}
                onClick={handleRemovePhoto}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Foto Profil (Gunakan Inisial Nama)</span>
              </button>
            </div>
          )}
        </div>
      </BottomSheet>

      {/* Modal BottomSheet: Pilih Mode Tampilan */}
      <BottomSheet
        isOpen={isThemeModeModalOpen}
        onClose={() => setIsThemeModeModalOpen(false)}
        title="Pilih Mode Tampilan"
      >
        <div className="space-y-3 pb-2">
          {/* Mode Terang */}
          <button
            type="button"
            onClick={() => handleSelectThemeMode(false)}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              !darkMode
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Mode Terang</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latar cerah bersih dan kontras tinggi untuk siang hari
                </p>
              </div>
            </div>
            {!darkMode && (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>

          {/* Mode Gelap */}
          <button
            type="button"
            onClick={() => handleSelectThemeMode(true)}
            className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              darkMode
                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-600'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Mode Gelap</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Latar gelap nyaman di mata untuk kondisi minim cahaya
                </p>
              </div>
            </div>
            {darkMode && (
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
            )}
          </button>
        </div>
      </BottomSheet>

      {/* Modal BottomSheet: Kustomisasi Tema Warna */}
      <BottomSheet
        isOpen={isThemeColorModalOpen}
        onClose={() => setIsThemeColorModalOpen(false)}
        title="Kustomisasi Tema Warna"
      >
        <div className="space-y-5 pb-2">
          {/* Preset Warna */}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2.5">
              Pilihan Warna Preset
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_COLOR_PRESETS.map((preset) => {
                const isSelected = (themeColor || '#2563EB').toLowerCase() === preset.value.toLowerCase();
                return (
                  <button
                    key={preset.value}
                    type="button"
                    onClick={() => {
                      handleSelectThemeColor(preset.value);
                      setCustomColorInput(preset.value);
                    }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-full shadow-xs flex-shrink-0"
                        style={{ backgroundColor: preset.value }}
                      />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {preset.name}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 ml-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Picker Kustom Bebas */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Pipette className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Warna Kustom (Bebas)
              </p>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3">
              Gunakan pemilih warna atau masukkan kode warna hex sesuai selera Anda.
            </p>

            <div className="flex items-center gap-2.5">
              <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xs flex-shrink-0 cursor-pointer">
                <input
                  type="color"
                  value={customColorInput.startsWith('#') && customColorInput.length === 7 ? customColorInput : '#2563EB'}
                  onChange={(e) => setCustomColorInput(e.target.value)}
                  className="absolute -inset-2 w-[200%] h-[200%] cursor-pointer opacity-0"
                />
                <div
                  className="w-full h-full rounded-xl"
                  style={{ backgroundColor: customColorInput }}
                />
              </div>

              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-slate-400">
                  #
                </span>
                <input
                  type="text"
                  maxLength={6}
                  value={customColorInput.replace(/^#/, '')}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/[^0-9A-Fa-f]/g, '');
                    setCustomColorInput(`#${clean}`);
                  }}
                  placeholder="2563EB"
                  className="w-full pl-7 pr-3 py-2.5 text-xs font-mono font-bold uppercase rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <Button
                type="button"
                size="sm"
                onClick={() => {
                  let hex = customColorInput;
                  if (!hex.startsWith('#')) hex = `#${hex}`;
                  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
                    handleSelectThemeColor(hex);
                  } else {
                    setError('Format kode warna tidak valid (contoh: #2563EB)');
                  }
                }}
                className="h-10 px-4 text-xs font-semibold"
              >
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </BottomSheet>

      {/* Modal BottomSheet: Konfirmasi Hapus Akun */}
      <BottomSheet
        isOpen={isDeleteAccountModalOpen}
        onClose={() => !isDeletingAccount && setIsDeleteAccountModalOpen(false)}
        title="Konfirmasi Hapus Akun"
      >
        <div className="space-y-4 pb-2">
          <div className="flex flex-col items-center text-center p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-2">
              <AlertTriangle className="w-6 h-6 stroke-[2]" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Hapus Akun Anda Secara Permanen?
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed max-w-xs">
              Tindakan ini tidak dapat dibatalkan. Seluruh riwayat transaksi, pos anggaran, sumber dana, catatan piutang, dan profil Anda akan <strong>dihapus permanen</strong> dari server DuitQ.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <Button
              variant="primary"
              onClick={handleDeleteAccount}
              isLoading={isDeletingAccount}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 cursor-pointer shadow-sm border-0"
              leftIcon={<Trash2 className="w-4 h-4 text-white" />}
            >
              Ya, Hapus Akun Saya
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={isDeletingAccount}
              onClick={() => setIsDeleteAccountModalOpen(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              Batal
            </Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
