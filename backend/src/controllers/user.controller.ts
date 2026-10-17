import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/user.service';
import { AppError } from '../middlewares/error.middleware';

export class UserController {
  /**
   * PATCH /api/v1/users/preferences/receivables, /preferences, /profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const result = await userService.updateUserProfile(
        req.user.id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Profil dan preferensi berhasil diperbarui',
        data: {
          user: result.user,
          preferences: result.preferences,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/users/account
   */
  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const result = await userService.deleteAccount(req.user.id);

      // Bersihkan cookie auth
      res.clearCookie('token');
      res.clearCookie('accessToken');

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Alias untuk backward-compatibility dengan endpoint lama
   */
  async updateReceivablesPreference(req: Request, res: Response, next: NextFunction) {
    return this.updateProfile(req, res, next);
  }
}

export const userController = new UserController();
