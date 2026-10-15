import { Request, Response, NextFunction } from 'express';
import { dashboardService } from '../services/dashboard.service';
import { AppError } from '../middlewares/error.middleware';

export class DashboardController {
  /**
   * GET /api/v1/dashboard/summary (DSH-01..DSH-05, RCV-04, Bab 6 & Bab 8)
   */
  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const data = await dashboardService.getSummary(req.user.id, {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        period: req.query.period as string | undefined,
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
