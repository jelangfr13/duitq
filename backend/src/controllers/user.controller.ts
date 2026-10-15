import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';

export class UserController {
  /**
   * PATCH /api/v1/users/preferences/receivables (RCV-01, Bab 6)
   */
  async updateReceivablesPreference(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const preferences = await userService.updateReceivablesPreference(
        req.user.id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Preferensi modul piutang berhasil diperbarui',
        data: {
          preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
