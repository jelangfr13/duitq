import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, PasswordResetToken } from '../models';
import { env } from '../config/env';
import { sendEmail } from '../config/mail';
import { AppError } from '../middlewares/error.middleware';
import {
  RegisterDTO,
  LoginDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
} from '../../../shared/types/user';

export class AuthService {
  /**
   * AUTH-01 & AUTH-02: Registrasi pengguna baru
   */
  async register(dto: RegisterDTO) {
    const email = dto.email.toLowerCase().trim();

    // Periksa keunikan email di koleksi users
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email sudah terdaftar dalam sistem', 409);
    }

    // Hash kata sandi dengan bcrypt (cost factor minimal 10)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await User.create({
      fullName: dto.fullName.trim(),
      email,
      passwordHash,
      preferences: {
        currency: 'IDR',
        enableReceivablesModule: false,
        hideBalanceDefault: false,
      },
    });

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }

  /**
   * AUTH-03: Login & pembuatan token JWT
   */
  async login(dto: LoginDTO) {
    const email = dto.email.toLowerCase().trim();

    // Verifikasi kredensial
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('Email atau kata sandi tidak valid', 401);
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Email atau kata sandi tidak valid', 401);
    }

    // Buat token JWT (access token & refresh token)
    const payload = {
      id: user._id.toString(),
      email: user.email,
    };

    const accessToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '7d',
    });

    const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: '30d',
    });

    return {
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
    };
  }

  /**
   * AUTH-04 & Bab 6: Mengambil profil pengguna aktif
   */
  async getMe(userId: string) {
    const user = await User.findById(userId).select('-passwordHash');
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      preferences: user.preferences,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * PWD-01 & PWD-02: Permintaan reset kata sandi via email
   */
  async forgotPassword(dto: ForgotPasswordDTO) {
    const email = dto.email.toLowerCase().trim();
    const user = await User.findOne({ email });

    // Respons generik selalu dikembalikan untuk mencegah email enumeration (PWD-01)
    const genericResponse: { message: string; resetUrl?: string } = {
      message: 'Jika email terdaftar, tautan reset kata sandi telah dikirim',
    };

    if (!user) {
      return genericResponse;
    }

    // Buat token acak 32 bytes (PWD-02)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 menit

    // Hapus token sebelumnya untuk pengguna ini jika ada
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Simpan token ke MongoDB (TTL Index akan menghapusnya otomatis saat kedaluwarsa)
    await PasswordResetToken.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      used: false,
      createdAt: new Date(),
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawToken}`;

    // Kirim email URL reset kata sandi menggunakan Gmail SMTP / Nodemailer
    try {
      await sendEmail({
        to: user.email,
        subject: '[DuitQ] Tautan Reset Kata Sandi Akun Anda',
        category: 'Password Reset',
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
            <div style="margin-bottom: 20px;">
              <span style="font-size: 22px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px;">DuitQ</span>
              <span style="font-size: 12px; color: #64748b; margin-left: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Keuangan Pribadi</span>
            </div>
            <p style="color: #1e293b; font-size: 15px; margin-top: 0;">Halo <strong>${user.fullName}</strong>,</p>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">Kami menerima permintaan untuk mengatur ulang kata sandi akun DuitQ Anda. Silakan klik tombol di bawah ini untuk membuat kata sandi baru:</p>
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">Reset Kata Sandi</a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.6;">Atau salin tautan berikut ke peramban Anda:<br/><a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a></p>
            <div style="background-color: #f8fafc; border-left: 3px solid #f59e0b; padding: 10px 14px; margin-top: 20px; border-radius: 6px;">
              <p style="color: #92400e; font-size: 12px; margin: 0; line-height: 1.5;">Tautan ini hanya berlaku selama <strong>15 menit</strong>. Jika Anda tidak merasa meminta reset kata sandi, abaikan email ini.</p>
            </div>
            <p style="color: #94a3b8; font-size: 11px; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">Email ini dikirim secara otomatis oleh sistem DuitQ.</p>
          </div>
        `,
        text: `Halo ${user.fullName},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun DuitQ Anda.\nSilakan buka tautan berikut untuk membuat kata sandi baru:\n${resetUrl}\n\nTautan ini hanya berlaku selama 15 menit.\nJika Anda tidak meminta reset kata sandi, abaikan email ini.`,
      });
      console.log(`[Email] ✅ Reset password email sent successfully to ${user.email}`);
    } catch (mailError: any) {
      console.warn('[Email] ⚠️ Could not send reset password email:', mailError.message || mailError);
    }

    // Tampilkan URL di console terminal backend untuk keperluan audit dan log server
    console.log(`[Auth] 🔑 Password reset URL for ${user.email}:\n${resetUrl}`);

    // Selalu kembalikan respons generik tanpa membocorkan resetUrl di HTTP response (PWD-01)
    return genericResponse;
  }

  /**
   * PWD-03: Eksekusi reset kata sandi dengan token baru
   */
  async resetPassword(dto: ResetPasswordDTO) {
    const tokenHash = crypto.createHash('sha256').update(dto.token.trim()).digest('hex');

    // Cari token hash yang valid dan belum kedaluwarsa
    const resetTokenDoc = await PasswordResetToken.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() },
    });

    if (!resetTokenDoc) {
      throw new AppError('Token reset kata sandi tidak valid atau telah kedaluwarsa', 400);
    }

    const user = await User.findById(resetTokenDoc.userId);
    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    // Hash kata sandi baru dengan bcrypt
    const passwordHash = await bcrypt.hash(dto.password, 10);
    user.passwordHash = passwordHash;
    await user.save();

    // Hapus dokumen token reset agar bersifat one-time use (PWD-03)
    await PasswordResetToken.deleteOne({ _id: resetTokenDoc._id });

    return {
      message: 'Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru Anda.',
    };
  }
}

export const authService = new AuthService();
