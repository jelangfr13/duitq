import { Request, Response, NextFunction } from 'express';
import { storageSpaceService } from '../services/storage-space.service';
import { AppError } from '../middlewares/error.middleware';

export class StorageSpaceController {
  /**
   * GET /api/v1/storage-spaces (SPC-01, SPC-04, Bab 6)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const options = {
        includeArchived: req.query.includeArchived === 'true',
      };

      const storageSpaces = await storageSpaceService.getAll(req.user.id, options);

      return res.status(200).json({
        success: true,
        data: {
          storageSpaces,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/storage-spaces (SPC-01, Bab 6)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const storageSpace = await storageSpaceService.create(req.user.id, req.body);

      return res.status(201).json({
        success: true,
        message: 'Ruang penyimpanan berhasil dibuat',
        data: {
          storageSpace,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/storage-spaces/:id/transactions (SPC-02, SPC-03, SPC-04, Bab 6)
   */
  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const data = await storageSpaceService.getTransactions(
        req.user.id,
        req.params.id
      );

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const storageSpaceController = new StorageSpaceController();
