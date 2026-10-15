import { Types } from 'mongoose';
import { User } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { UpdatePreferencesDTO } from '../../../shared/types/user';

export class UserService {
  /**
   * RCV-01 (Bab 6): Toggle preferensi modul Piutang (enableReceivablesModule) & privasi saldo
   */
  async updateReceivablesPreference(
    userId: string,
    dto: UpdatePreferencesDTO
  ) {
    const userObjId = new Types.ObjectId(userId);
    const user = await User.findById(userObjId);

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    if (dto.enableReceivablesModule !== undefined) {
      user.preferences.enableReceivablesModule = dto.enableReceivablesModule;
    }

    if (dto.hideBalanceDefault !== undefined) {
      user.preferences.hideBalanceDefault = dto.hideBalanceDefault;
    }

    await user.save();

    return user.preferences;
  }
}

export const userService = new UserService();
