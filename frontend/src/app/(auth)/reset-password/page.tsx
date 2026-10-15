'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api';
import { resetPasswordSchema } from '@shared/types/user';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPasswordMutation } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validasi kriteria
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isMatched = password.length > 0 && password === confirmPassword;

  // Jika token tidak ada di query parameter URL
  if (!token) {
    return (
      <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Token Tidak Ditemukan
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Tautan reset kata sandi tidak valid atau parameter token tidak disertakan. Silakan ajukan permintaan baru dari halaman Lupa Kata Sandi.
        </p>
        <Button
          onClick={() => router.push('/forgot-password')}
          className="w-full mt-6 font-semibold"
        >
          Ajukan Tautan Baru
        </Button>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }

    // Validasi Zod (PWD-03)
    const validation = resetPasswordSchema.safeParse({ token, password });
    if (!validation.success) {
      const errors: { password?: string } = {};
      for (const err of validation.error.issues) {
        if (err.path[0] === 'password') errors.password = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        token,
        password,
      });
      setIsSuccess(true);
    } catch (err) {
      setGeneralError(getErrorMessage(err));
    }
  };

  if (isSuccess) {
    return (
      <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Kata Sandi Berhasil Diperbarui!
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Kata sandi baru Anda telah aktif. Silakan masuk menggunakan kata sandi yang baru saja Anda buat.
        </p>
        <Button
          onClick={() => router.push('/login')}
          className="w-full mt-6 font-semibold"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Masuk ke Akun
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white">
      <div className="mb-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          <KeyRound className="w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Atur Ulang Kata Sandi
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">
          Buat kata sandi baru yang kuat untuk mengamankan akun DuitQ Anda.
        </p>
      </div>

      {generalError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="leading-relaxed">{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Input
            label="Kata Sandi Baru"
            id="password"
            type="password"
            placeholder="Minimal 8 karakter kombinasi"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required
          />

          <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  hasMinLength ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <span className={hasMinLength ? 'text-emerald-700' : 'text-slate-500'}>
                Minimal 8 karakter
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  hasLetter ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <span className={hasLetter ? 'text-emerald-700' : 'text-slate-500'}>
                Mengandung kombinasi huruf
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  hasNumber ? 'text-emerald-600' : 'text-slate-300'
                }`}
              />
              <span className={hasNumber ? 'text-emerald-700' : 'text-slate-500'}>
                Mengandung kombinasi angka
              </span>
            </div>
          </div>
        </div>

        <Input
          label="Konfirmasi Kata Sandi Baru"
          id="confirmPassword"
          type="password"
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          error={fieldErrors.confirmPassword}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete="new-password"
          required
        />

        {confirmPassword && (
          <p className={`text-[11px] font-medium ${isMatched ? 'text-emerald-600' : 'text-rose-500'}`}>
            {isMatched ? '✓ Konfirmasi kata sandi cocok' : '✗ Kata sandi belum cocok'}
          </p>
        )}

        <Button
          type="submit"
          className="w-full mt-2 font-semibold"
          isLoading={resetPasswordMutation.isPending}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Perbarui Kata Sandi
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Batal dan Kembali ke Masuk
        </Link>
      </div>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
          <p className="text-xs text-slate-500">Memuat formulir reset kata sandi...</p>
        </Card>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
