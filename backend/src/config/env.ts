import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Mendapatkan base URL aplikasi frontend production yang aman dan bersih
 * Menjamin tidak pernah mengandung localhost atau daftar multi-origin berkoma
 */
export function getCleanFrontendUrl(): string {
  // 1. Cek jika APP_URL diset dan bukan localhost
  const appUrl = process.env.APP_URL?.trim();
  if (appUrl && !appUrl.includes('localhost') && !appUrl.includes('127.0.0.1')) {
    return appUrl.replace(/\/$/, '');
  }

  // 2. Ambil dari FRONTEND_URL (bisa berupa daftar comma-separated untuk CORS)
  const rawFrontendUrl = process.env.FRONTEND_URL || '';
  const origins = rawFrontendUrl
    .split(',')
    .map((u) => u.trim().replace(/\/$/, ''))
    .filter(Boolean);

  // Ambil origin pertama yang BUKAN localhost
  const nonLocalOrigin = origins.find(
    (u) => !u.includes('localhost') && !u.includes('127.0.0.1')
  );

  if (nonLocalOrigin) {
    return nonLocalOrigin;
  }

  // 3. Fallback absolut domain production DuitQ (tidak pernah localhost)
  return 'https://duitq.vercel.app';
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/duitq',
  JWT_SECRET: process.env.JWT_SECRET || 'duitq-jwt-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '1d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  APP_URL: getCleanFrontendUrl(),

  // Cookie sameSite configuration ('lax' | 'none' | 'strict')
  COOKIE_SAME_SITE: process.env.COOKIE_SAME_SITE || '',

  // Email Provider: 'gmail' | 'mailtrap' | 'smtp'
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'gmail',
  SMTP_SERVICE: process.env.SMTP_SERVICE || '',

  // SMTP Email configuration
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '465', 10),
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  SMTP_FROM: process.env.SMTP_FROM || 'DuitQ <noreply@duitq.app>',

  // Mailtrap Email Sending API configuration
  MAILTRAP_TOKEN: process.env.MAILTRAP_TOKEN || '',
  MAILTRAP_SENDER_EMAIL: process.env.MAILTRAP_SENDER_EMAIL || 'hello@demomailtrap.co',
  MAILTRAP_SENDER_NAME: process.env.MAILTRAP_SENDER_NAME || 'DuitQ',

  // Developer / Super Admin email configuration
  DEV_ADMIN_EMAIL: (process.env.DEV_ADMIN_EMAIL || '').toLowerCase().trim(),
};

// Validasi Keamanan Mode Production
if (env.NODE_ENV === 'production') {
  if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'duitq-jwt-secret-key-change-in-production' ||
    process.env.JWT_SECRET.length < 16
  ) {
    console.error(
      '[SECURITY FATAL] JWT_SECRET wajib diatur menggunakan string acak yang kuat (minimal 32 karakter) di lingkungan production!'
    );
    throw new Error('Insecure JWT_SECRET in production environment');
  }

  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost')) {
    console.warn(
      '[SECURITY WARNING] MONGODB_URI belum diatur atau masih mengarah ke localhost pada mode production.'
    );
  }
}

