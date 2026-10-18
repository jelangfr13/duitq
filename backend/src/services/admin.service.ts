import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Types } from 'mongoose';
import { User, FundingSource, Transaction, PasswordResetToken } from '../models';
import { userService } from './user.service';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

export interface AdminUserListItem {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  fundingSourcesCount: number;
  transactionsCount: number;
  isDevAdmin: boolean;
  hasPendingResetRequest: boolean;
  resetRequestedAt: Date | null;
  resetRequestNote: string | null;
  mustResetPassword: boolean;
}

export class AdminService {
  /**
   * Mengambil daftar seluruh pengguna terdaftar di DuitQ
   */
  async getAllUsers(search?: string): Promise<AdminUserListItem[]> {
    const filter: Record<string, any> = {};

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }];
    }

    const users = await User.find(filter)
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    const adminEmail = (env.DEV_ADMIN_EMAIL || '').toLowerCase().trim();

    // Dapatkan hitungan sumber dana & transaksi per pengguna
    const userStats = await Promise.all(
      users.map(async (u) => {
        const userObjId = u._id;
        const [fundingSourcesCount, transactionsCount] = await Promise.all([
          FundingSource.countDocuments({ userId: userObjId }),
          Transaction.countDocuments({ userId: userObjId }),
        ]);

        const isDevAdmin = Boolean(
          adminEmail && u.email.toLowerCase().trim() === adminEmail
        );

        return {
          id: u._id.toString(),
          fullName: u.fullName,
          email: u.email,
          avatarUrl: u.avatarUrl ?? null,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
          fundingSourcesCount,
          transactionsCount,
          isDevAdmin,
          hasPendingResetRequest: Boolean(u.hasPendingResetRequest),
          resetRequestedAt: u.resetRequestedAt ?? null,
          resetRequestNote: u.resetRequestNote ?? null,
          mustResetPassword: Boolean(u.mustResetPassword),
        };
      })
    );

    return userStats;
  }

  /**
   * Reset kata sandi pengguna secara langsung oleh admin
   */
  async resetUserPassword(
    adminUserId: string,
    targetUserId: string,
    customPassword?: string
  ) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('ID pengguna tidak valid', 400);
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    // Bersihkan permintaan reset yang tertunda
    targetUser.hasPendingResetRequest = false;
    targetUser.resetRequestedAt = null;
    targetUser.resetRequestNote = null;

    let plainPassword = customPassword?.trim();

    if (!plainPassword) {
      // Kotak kata sandi dikosongkan: tandai bahwa pengguna WAJIB memasukkan kata sandi baru saat login kembali
      targetUser.mustResetPassword = true;
      const randomSecret = crypto.randomBytes(32).toString('hex');
      targetUser.passwordHash = await bcrypt.hash(randomSecret, 10);
      await targetUser.save();

      // Hapus seluruh token reset yang masih aktif untuk keamanan
      await PasswordResetToken.deleteMany({ userId: targetUser._id });

      return {
        mode: 'FORCE_RESET_ON_LOGIN',
        message: `Permintaan reset kata sandi berhasil diset. Ketika ${targetUser.email} mencoba login kembali, mereka akan langsung diminta untuk memasukkan kata sandi baru.`,
        targetUserId: targetUser._id.toString(),
        targetEmail: targetUser.email,
      };
    } else {
      if (plainPassword.length < 8) {
        throw new AppError('Kata sandi baru minimal 8 karakter', 400);
      }

      const passwordHash = await bcrypt.hash(plainPassword, 10);
      targetUser.passwordHash = passwordHash;
      targetUser.mustResetPassword = false;
      await targetUser.save();

      // Hapus seluruh token reset yang masih aktif untuk keamanan
      await PasswordResetToken.deleteMany({ userId: targetUser._id });

      return {
        mode: 'CUSTOM_PASSWORD',
        message: `Kata sandi untuk akun ${targetUser.email} berhasil direset.`,
        targetUserId: targetUser._id.toString(),
        targetEmail: targetUser.email,
        newPassword: plainPassword,
      };
    }
  }

  /**
   * Hapus akun pengguna dan seluruh data transaksinya secara permanen
   */
  async deleteUser(adminUserId: string, targetUserId: string) {
    if (!Types.ObjectId.isValid(targetUserId)) {
      throw new AppError('ID pengguna tidak valid', 400);
    }

    if (adminUserId === targetUserId) {
      throw new AppError(
        'Anda tidak dapat menghapus akun developer admin Anda sendiri dari Admin Panel.',
        400
      );
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    const adminEmail = (env.DEV_ADMIN_EMAIL || '').toLowerCase().trim();
    if (adminEmail && targetUser.email.toLowerCase().trim() === adminEmail) {
      throw new AppError('Akun developer admin utama tidak dapat dihapus.', 400);
    }

    await userService.deleteAccount(targetUserId);

    return {
      message: `Akun ${targetUser.email} dan seluruh data keuangannya telah berhasil dihapus secara permanen.`,
    };
  }
}

export const adminService = new AdminService();
