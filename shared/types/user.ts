import { z } from 'zod';

export interface IUserPreferences {
  currency: 'IDR';
  enableReceivablesModule: boolean;
  hideBalanceDefault: boolean;
  darkMode: boolean;
  themeColor: string;
}

export interface IUser {
  _id: string;
  fullName: string;
  email: string;
  passwordHash?: string;
  avatarUrl?: string | null;
  preferences: IUserPreferences;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface IPasswordResetToken {
  _id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date | string;
  used: boolean;
  createdAt: Date | string;
}

export const registerSchema = z.object({
  fullName: z.string().trim().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Kata sandi harus mengandung kombinasi huruf')
    .regex(/[0-9]/, 'Kata sandi harus mengandung kombinasi angka'),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
  password: z.string().min(1, 'Kata sandi wajib diisi'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Format email tidak valid'),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1, 'Token reset kata sandi wajib diisi'),
  password: z
    .string()
    .min(8, 'Kata sandi minimal 8 karakter')
    .regex(/[a-zA-Z]/, 'Kata sandi harus mengandung kombinasi huruf')
    .regex(/[0-9]/, 'Kata sandi harus mengandung kombinasi angka'),
});

export const updatePreferencesSchema = z.object({
  fullName: z.string().trim().min(1, 'Nama lengkap tidak boleh kosong').optional(),
  avatarUrl: z.string().nullable().optional(),
  enableReceivablesModule: z.boolean().optional(),
  hideBalanceDefault: z.boolean().optional(),
  darkMode: z.boolean().optional(),
  themeColor: z.string().optional(),
  preferences: z
    .object({
      enableReceivablesModule: z.boolean().optional(),
      hideBalanceDefault: z.boolean().optional(),
      darkMode: z.boolean().optional(),
      themeColor: z.string().optional(),
    })
    .optional(),
});

export const updateUserProfileSchema = updatePreferencesSchema;

export type RegisterDTO = z.infer<typeof registerSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
export type ForgotPasswordDTO = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema>;
export type UpdatePreferencesDTO = z.infer<typeof updatePreferencesSchema>;
export type UpdateUserProfileDTO = z.infer<typeof updateUserProfileSchema>;
