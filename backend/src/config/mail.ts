import { MailtrapClient } from 'mailtrap';
import nodemailer from 'nodemailer';
import { env } from './env';

// 1. Inisialisasi Mailtrap Client SDK resmi (jika digunakan)
export const mailtrapClient = env.MAILTRAP_TOKEN
  ? new MailtrapClient({
      token: env.MAILTRAP_TOKEN,
    })
  : null;

// 2. Inisialisasi Nodemailer Transporter (Gmail / Custom SMTP)
export const mailTransporter = nodemailer.createTransport(
  env.SMTP_SERVICE === 'gmail' || env.EMAIL_PROVIDER === 'gmail'
    ? {
        service: 'gmail',
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE,
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
);

export interface SendEmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  category?: string;
}

/**
 * Pengirim email terpadu untuk DuitQ.
 * Mendukung Gmail SMTP (default rekomendasi untuk pengiriman ke email nyata mana pun),
 * Mailtrap API Client SDK (jika EMAIL_PROVIDER=mailtrap), dan Custom SMTP server.
 */
export const sendEmail = async (options: SendEmailOptions) => {
  // 1. Opsi jika EMAIL_PROVIDER diatur ke 'mailtrap' dan token valid
  if (env.EMAIL_PROVIDER === 'mailtrap' && mailtrapClient && env.MAILTRAP_TOKEN) {
    const response = await mailtrapClient.send({
      from: {
        email: env.MAILTRAP_SENDER_EMAIL,
        name: env.MAILTRAP_SENDER_NAME,
      },
      to: [{ email: options.to }],
      subject: options.subject,
      text: options.text || '',
      html: options.html,
      category: options.category || 'DuitQ Notification',
    });
    return response;
  }

  // 2. Default: Kirim via Gmail / Nodemailer SMTP
  return await mailTransporter.sendMail({
    from: env.SMTP_FROM,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  });
};

export const verifyMailConnection = async (): Promise<boolean> => {
  if (env.EMAIL_PROVIDER === 'mailtrap' && mailtrapClient && env.MAILTRAP_TOKEN) {
    console.log('[Email] ✅ Mailtrap API Client SDK aktif (Token terkonfigurasi)');
    return true;
  }

  try {
    await mailTransporter.verify();
    const providerName =
      env.SMTP_SERVICE === 'gmail' || env.EMAIL_PROVIDER === 'gmail' ? 'Gmail SMTP' : 'SMTP Server';
    console.log(`[Email] ✅ ${providerName} connection verified successfully (${env.SMTP_USER})`);
    return true;
  } catch (error: any) {
    console.warn('[Email] ⚠️ Mail server connection failed:', error.message || error);
    console.warn(
      '[Email] ℹ️ Pastikan EMAIL_PROVIDER, SMTP_USER, dan SMTP_PASS di backend/.env sudah diisi dengan benar.'
    );
    return false;
  }
};

