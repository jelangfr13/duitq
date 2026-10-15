'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api';
import { forgotPasswordSchema } from '@shared/types/user';

export default function ForgotPasswordPage() {
  const { forgotPasswordMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldError(undefined);

    // Validasi Zod (PWD-01)
    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setFieldError(validation.error.errors[0]?.message);
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({
        email: email.trim().toLowerCase(),
      });
      setIsSubmitted(true);
    } catch (err) {
      setGeneralError(getErrorMessage(err));
    }
  };

  if (isSubmitted) {
    return (
      <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white text-center">
        <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Periksa Email Anda
        </h1>
        <p className="text-xs text-slate-600 mt-2 leading-relaxed">
          Jika email <strong className="text-slate-800">{email}</strong> terdaftar dalam sistem DuitQ, kami telah mengirimkan tautan pemulihan kata sandi. Tautan hanya berlaku selama <strong>15 menit</strong>.
        </p>

        <div className="mt-4 p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-left space-y-1">
          <p className="text-xs font-semibold text-amber-900">
            Tidak menemukan email di Kotak Masuk?
          </p>
          <p className="text-[11px] text-amber-800 leading-relaxed">
            Periksa juga folder <strong>Spam</strong>, <strong>Sampah</strong>, atau tab <strong>Promosi/Update</strong> pada akun email Anda.
          </p>
        </div>

        <div className="mt-6 space-y-3">
          <Button
            variant="outline"
            onClick={() => setIsSubmitted(false)}
            className="w-full text-xs"
          >
            Kirim Ulang ke Email Lain
          </Button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 w-full py-2"
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
          Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan aman untuk mengatur ulang kata sandi Anda.
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

        <Button
          type="submit"
          className="w-full mt-2 font-semibold"
          isLoading={forgotPasswordMutation.isPending}
          rightIcon={<Send className="w-4 h-4" />}
        >
          Kirim Tautan Pemulihan
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Halaman Masuk
        </Link>
      </div>
    </Card>
  );
}
