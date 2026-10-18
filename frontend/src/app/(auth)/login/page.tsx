'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/api';
import { loginSchema } from '@shared/types/user';

export default function LoginPage() {
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Validasi lokal dengan skema Zod sebelum kirim ke backend
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const errors: { email?: string; password?: string } = {};
      for (const err of validation.error.issues) {
        if (err.path[0] === 'email') errors.email = err.message;
        if (err.path[0] === 'password') errors.password = err.message;
      }
      setFieldErrors(errors);
      return;
    }

    try {
      const res = await loginMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        password,
      });

      if (res?.requirePasswordReset || res?.data?.requirePasswordReset) {
        const resetToken = res?.data?.resetToken || res?.resetToken;
        if (resetToken && typeof window !== 'undefined') {
          window.location.href = `/reset-password?token=${resetToken}&adminReset=true`;
          return;
        }
      }
    } catch (err) {
      setGeneralError(getErrorMessage(err));
    }
  };

  return (
    <Card className="p-6 sm:p-8 border border-slate-100 shadow-sm rounded-2xl bg-white">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs text-slate-500 mt-1.5">
          Kelola sumber dana, alokasi ruang, dan piutang dalam satu kendali.
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
            placeholder="Masukkan kata sandi"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }}
            error={fieldErrors.password}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="current-password"
            required
          />
          <div className="flex justify-end mt-1.5">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2 font-semibold"
          isLoading={loginMutation.isPending}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Masuk ke DuitQ
        </Button>
      </form>

      <div className="mt-6 pt-5 border-t border-slate-100 text-center">
        <p className="text-xs text-slate-600">
          Belum memiliki akun?{' '}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Daftar sekarang
          </Link>
        </p>
      </div>
    </Card>
  );
}
