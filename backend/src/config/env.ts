import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root or current directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/duitq',
  JWT_SECRET: process.env.JWT_SECRET || 'duitq-jwt-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',

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

