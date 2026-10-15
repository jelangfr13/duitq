import { Request, Response, NextFunction } from 'express';
import { receivableService } from '../services/receivable.service';
import { AppError } from '../middlewares/error.middleware';

export class ReceivableController {
  /**
   * POST /api/v1/receivables (RCV-02, Bab 6)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const receivable = await receivableService.create(req.user.id, req.body);

      return res.status(201).json({
        success: true,
        message: 'Piutang baru berhasil dicatat',
        data: {
          receivable,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/receivables/:id/repay (RCV-03, Bab 6)
   */
  async repay(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const receivable = await receivableService.repay(
        req.user.id,
        req.params.id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Pelunasan piutang berhasil dicatat',
        data: {
          receivable,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const receivableController = new ReceivableController();
