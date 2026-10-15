import { Request, Response, NextFunction } from 'express';
import { transactionService } from '../services/transaction.service';
import { AppError } from '../middlewares/error.middleware';

export class TransactionController {
  /**
   * POST /api/v1/transactions (TRX-01, TRX-02, Bab 6)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const transaction = await transactionService.create(req.user.id, req.body);

      return res.status(201).json({
        success: true,
        message: 'Transaksi berhasil disimpan',
        data: {
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/transactions/:id (TRX-03, Bab 6)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const transaction = await transactionService.update(
        req.user.id,
        req.params.id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Transaksi berhasil diperbarui',
        data: {
          transaction,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/transactions/:id (TRX-03, Bab 6)
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const result = await transactionService.delete(req.user.id, req.params.id);

      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const transactionController = new TransactionController();
