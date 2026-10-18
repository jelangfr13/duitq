'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Send,
  ShieldAlert,
  ShieldCheck,
  KeyRound,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api';
import { forgotPasswordSchema, requestAdminResetSchema } from '@shared/types/user';

type ResetMethod = 'ADMIN_REQUEST' | 'EMAIL_VERIFICATION';

export default function ForgotPasswordPage() {
  const { forgotPasswordMutation, requestAdminResetMutation } = useAuth();
  const [method, setMethod] = useState<ResetMethod>('ADMIN_REQUEST');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submittedMethod, setSubmittedMethod] = useState<ResetMethod | null>(null);

  const isSubmitting =
    forgotPasswordMutation.isPending || requestAdminResetMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldError(undefined);

    const cleanEmail = email.trim().toLowerCase();

    if (method === 'ADMIN_REQUEST') {
      const validation = requestAdminResetSchema.safeParse({
        email: cleanEmail,
        note: note.trim() || undefined,
      });

      if (!validation.success) {
        setFieldError(validation.error.issues[0]?.message);
        return;
      }

      try {
        await requestAdminResetMutation.mutateAsync({
          email: cleanEmail,
          note: note.trim() || undefined,
        });
        setSubmittedMethod('ADMIN_REQUEST');
      } catch (err) {
        setGeneralError(getErrorMessage(err));
      }
    } else {
      const validation = forgotPasswordSchema.safeParse({ email: cleanEmail });
      if (!validation.success) {
        setFieldError(validation.error.issues[0]?.message);
        return;
      }

      try {
        await forgotPasswordMutation.mutateAsync({
          email: cleanEmail,
        });
        setSubmittedMethod('EMAIL_VERIFICATION');
      } catch (err) {
        setGeneralError(getErrorMessage(err));
      }
    }
  };

  // State Sukses Permintaan ke Admin
  if (submittedMethod === 'ADMIN_REQUEST') {
    return (
      <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Permintaan Terkirim ke Admin
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Permintaan reset kata sandi untuk akun <strong className="text-slate-800">{email}</strong> telah diteruskan ke tim Developer / Administrator DuitQ.
        </p>

        <div className="mt-4 p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-left space-y-1.5">
          <p className="text-xs font-semibold text-blue-950 flex items-center gap-1.5">
            <UserCheck className="w-4 h-4 text-blue-600" />
            Langkah Selanjutnya:
          </p>
          <p className="text-[11px] text-blue-900 leading-relaxed">
            Admin akan meninjau akun Anda dan mereset kata sandi Anda. Ketika Anda mencoba login kembali, sistem akan <strong>langsung meminta Anda memasukkan kata sandi baru</strong>.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/login"
            className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            Kembali ke Halaman Masuk
          </Link>
          <Button
            variant="outline"
            onClick={() => setSubmittedMethod(null)}
            className="w-full text-xs"
          >
            Ajukan Permintaan Lain
          </Button>
        </div>
      </Card>
    );
  }

  // State Sukses Kirim Email
  if (submittedMethod === 'EMAIL_VERIFICATION') {
    return (
      <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Periksa Email Anda
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Jika email <strong className="text-slate-800">{email}</strong> terdaftar dalam sistem DuitQ, kami telah mengirimkan tautan dan kode verifikasi reset kata sandi. Berlaku selama <strong>15 menit</strong>.
        </p>

        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left space-y-1">
          <p className="text-xs font-semibold text-amber-900">
            Tidak menemukan email di Kotak Masuk?
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Periksa folder <strong>Spam</strong>, <strong>Sampah</strong>, atau tab <strong>Promosi/Update</strong>. Tautan yang dikirimkan aman dan mengarah langsung ke domain resmi DuitQ.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/reset-password"
            className="block w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm text-center"
          >
            Sudah Dapat Kode? Masukkan di Sini
          </Link>
          <Button
            variant="outline"
            onClick={() => setSubmittedMethod(null)}
            className="w-full text-xs"
          >
            Kirim Ulang ke Email Lain
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 w-full py-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Kembali ke Halaman Masuk
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Lupa Kata Sandi?
        </h1>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Pilih salah satu metode di bawah ini untuk memulihkan akses ke akun DuitQ Anda.
        </p>
      </div>

      {/* Pilihan Metode Pemulihan */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        <button
          type="button"
          onClick={() => {
            setMethod('ADMIN_REQUEST');
            setGeneralError(null);
            setFieldError(undefined);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
            method === 'ADMIN_REQUEST'
              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-2.5 mb-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                method === 'ADMIN_REQUEST'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p
                className={`text-xs font-bold leading-tight ${
                  method === 'ADMIN_REQUEST' ? 'text-blue-900' : 'text-slate-900'
                }`}
              >
                Minta Bantuan Admin
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-medium text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded">
                Opsi 1 (Disarankan)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Admin/Developer akan mereset akun Anda dari Admin Panel tanpa perlu klik tautan email.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setMethod('EMAIL_VERIFICATION');
            setGeneralError(null);
            setFieldError(undefined);
          }}
          className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
            method === 'EMAIL_VERIFICATION'
              ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div className="flex items-start gap-2.5 mb-2">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                method === 'EMAIL_VERIFICATION'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p
                className={`text-xs font-bold leading-tight ${
                  method === 'EMAIL_VERIFICATION' ? 'text-blue-900' : 'text-slate-900'
                }`}
              >
                Kirim Kode ke Email
              </p>
              <span className="inline-block mt-0.5 text-[10px] font-medium text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                Opsi 2 (Mandiri)
              </span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug">
            Kirimkan tautan reset resmi dan kode verifikasi langsung ke email terdaftar Anda.
          </p>
        </button>
      </div>

      {/* Info Banner Konteks */}
      {method === 'ADMIN_REQUEST' ? (
        <div className="mb-4 p-3 rounded-xl bg-blue-50/60 border border-blue-100 text-blue-900 text-xs flex items-start gap-2">
          <KeyRound className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Developer / Admin akan menerima notifikasi permintaan Anda. Saat admin memprosesnya, Anda akan <strong>langsung diminta memasukkan kata sandi baru</strong> saat login kembali.
          </p>
        </div>
      ) : (
        <div className="mb-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-700 text-xs flex items-start gap-2">
          <Mail className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            Sistem otomatis mengirimkan tautan reset dan kode token verifikasi ke email Anda. Tautan pemulihan berlaku selama 15 menit.
          </p>
        </div>
      )}

      {generalError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="leading-relaxed">{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email Terdaftar"
          id="email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(undefined);
          }}
          error={fieldError}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        {method === 'ADMIN_REQUEST' && (
          <div>
            <label
              htmlFor="note"
              className="block text-xs font-medium text-slate-700 mb-1.5"
            >
              Catatan / Kendala (Opsional)
            </label>
            <div className="relative">
              <textarea
                id="note"
                rows={2}
                maxLength={300}
                placeholder="Misal: Saya tidak menerima kode email / nomor ponsel sudah tidak aktif"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white placeholder:text-slate-400 text-slate-900 transition-all resize-none"
              />
            </div>
            <p className="text-[10px] text-slate-400 text-right mt-1">
              {note.length}/300 karakter
            </p>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-2 font-semibold"
          isLoading={isSubmitting}
          rightIcon={<Send className="w-4 h-4" />}
        >
          {method === 'ADMIN_REQUEST'
            ? 'Kirim Permintaan ke Admin / Developer'
            : 'Kirim Kode & Tautan ke Email'}
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Masuk
        </Link>

        {method === 'EMAIL_VERIFICATION' && (
          <Link
            href="/reset-password"
            className="text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sudah Punya Token?
          </Link>
        )}
      </div>
    </Card>
  );
}
