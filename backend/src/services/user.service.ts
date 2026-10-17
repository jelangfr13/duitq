import { Types } from 'mongoose';
import {
  User,
  FundingSource,
  Transaction,
  Budget,
  StorageSpace,
  Receivable,
  PasswordResetToken,
} from '../models';
import { AppError } from '../middlewares/error.middleware';
import { UpdateUserProfileDTO } from '../../../shared/types/user';

export class UserService {
  /**
   * Update profil pengguna dan preferensi (RCV-01, Update v1.2)
   */
  async updateUserProfile(userId: string, dto: UpdateUserProfileDTO) {
    const userObjId = new Types.ObjectId(userId);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    // 1. Update fullName jika diberikan
    if (dto.fullName !== undefined) {
      user.fullName = dto.fullName.trim();
    }

    // 2. Update avatarUrl jika diberikan (mendukung string Base64/URL atau null untuk hapus foto)
    if (dto.avatarUrl !== undefined) {
      user.avatarUrl = dto.avatarUrl;
    }

    // 3. Pastikan preferences terinisialisasi
    if (!user.preferences) {
      user.preferences = {
        currency: 'IDR',
        enableReceivablesModule: false,
        hideBalanceDefault: false,
        darkMode: false,
        themeColor: '#2563EB',
      };
    }

    // 4. Update preferensi (dukung format flat maupun nested preferences)
    const prefs = dto.preferences;

    if (dto.enableReceivablesModule !== undefined) {
      user.preferences.enableReceivablesModule = dto.enableReceivablesModule;
    } else if (prefs?.enableReceivablesModule !== undefined) {
      user.preferences.enableReceivablesModule = prefs.enableReceivablesModule;
    }

    if (dto.hideBalanceDefault !== undefined) {
      user.preferences.hideBalanceDefault = dto.hideBalanceDefault;
    } else if (prefs?.hideBalanceDefault !== undefined) {
      user.preferences.hideBalanceDefault = prefs.hideBalanceDefault;
    }

    if (dto.darkMode !== undefined) {
      user.preferences.darkMode = dto.darkMode;
    } else if (prefs?.darkMode !== undefined) {
      user.preferences.darkMode = prefs.darkMode;
    }

    if (dto.themeColor !== undefined) {
      user.preferences.themeColor = dto.themeColor;
    } else if (prefs?.themeColor !== undefined) {
      user.preferences.themeColor = prefs.themeColor;
    }

    user.markModified('preferences');
    await user.save();

    const formattedUser = {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      preferences: {
        currency: user.preferences.currency || 'IDR',
        enableReceivablesModule: !!user.preferences.enableReceivablesModule,
        hideBalanceDefault: !!user.preferences.hideBalanceDefault,
        darkMode: !!user.preferences.darkMode,
        themeColor: user.preferences.themeColor || '#2563EB',
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return {
      user: formattedUser,
      preferences: formattedUser.preferences,
    };
  }

  /**
   * Hapus akun pengguna beserta seluruh data transaksinya secara permanen
   */
  async deleteAccount(userId: string) {
    const userObjId = new Types.ObjectId(userId);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    // Hapus seluruh data pengguna secara cascading
    await Promise.all([
      Transaction.deleteMany({ userId: userObjId }),
      Budget.deleteMany({ userId: userObjId }),
      FundingSource.deleteMany({ userId: userObjId }),
      StorageSpace.deleteMany({ userId: userObjId }),
      Receivable.deleteMany({ userId: userObjId }),
      PasswordResetToken.deleteMany({ userId: userObjId }),
      User.findByIdAndDelete(userObjId),
    ]);

    return { message: 'Akun dan seluruh data Anda telah berhasil dihapus secara permanen.' };
  }

  /**
   * Alias untuk backward-compatibility dengan kode lama
   */
  async updateReceivablesPreference(
    userId: string,
    dto: UpdateUserProfileDTO
  ) {
    const result = await this.updateUserProfile(userId, dto);
    return result.preferences;
  }
}

export const userService = new UserService();
