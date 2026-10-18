import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { AppError } from '../middlewares/error.middleware';

export class AdminController {
  /**
   * GET /api/v1/admin/users
   */
  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const search = typeof req.query.search === 'string' ? req.query.search : undefined;
      const users = await adminService.getAllUsers(search);

      return res.status(200).json({
        success: true,
        data: {
          users,
          total: users.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/users/:id/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        throw new AppError('Sesi tidak valid', 401);
      }

      const targetUserId = req.params.id;
      const { newPassword } = req.body || {};

      const result = await adminService.resetUserPassword(
        adminUserId,
        targetUserId,
        newPassword
      );

      return res.status(200).json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/admin/users/:id
   */
  async deleteUser(req: Request, res: Response, next: NextFunction) {
    try {
      const adminUserId = req.user?.id;
      if (!adminUserId) {
        throw new AppError('Sesi tidak valid', 401);
      }

      const targetUserId = req.params.id;
      const result = await adminService.deleteUser(adminUserId, targetUserId);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
