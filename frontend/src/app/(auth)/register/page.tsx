'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User as UserIcon, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api';
import { registerSchema } from '@shared/types/user';

export default function RegisterPage() {
  const router = useRouter();
  const { registerMutation } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
  }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Evaluasi kriteria kata sandi secara interaktif
  const hasMinLength = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Validasi Zod (AUTH-01)
    const validation = registerSchema.safeParse({ fullName, email, password });
    if (!validation.success) {
      const errors: { fullName?: string; email?: string; password?: string } = {};
      for (const err of validation.error.issues) {
        if (err.path[0] === 'fullName') errors.fullName = err.message;
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      await registerMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
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
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Pendaftaran Berhasil!
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Akun Anda telah berhasil dibuat. Silakan masuk menggunakan email dan kata sandi yang telah Anda daftarkan.
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
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Buat Akun DuitQ Baru
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">
          Mulai langkah cerdas atur arus kas, pos anggaran, dan piutang Anda.
        </p>
      </div>

      {generalError && (
        <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-100 flex items-start gap-2.5 text-rose-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
          <span className="leading-relaxed">{generalError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nama Lengkap"
          id="fullName"
          type="text"
          placeholder="Nama Anda"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fieldErrors.fullName) setFieldErrors((prev) => ({ ...prev, fullName: undefined }));
          }}
          error={fieldErrors.fullName}
          leftIcon={<UserIcon className="w-4 h-4" />}
          autoComplete="name"
          required
        />

        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="nama@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: undefined }));
          }}
          error={fieldErrors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <div>
          <Input
            label="Kata Sandi"
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

          {/* Indikator Validasi Kata Sandi (AUTH-01) */}
          <div className="mt-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col gap-1.5 text-[11px]">
            <span className="font-semibold text-slate-600 mb-0.5">Syarat Kata Sandi:</span>
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

        <Button
          type="submit"
          className="w-full mt-2 font-semibold"
          isLoading={registerMutation.isPending}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Daftar Akun DuitQ
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Sudah memiliki akun?{' '}
          <Link
            href="/login"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Masuk sekarang
          </Link>
        </p>
      </div>
    </Card>
  );
}
