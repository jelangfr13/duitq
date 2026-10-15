import { Request, Response, NextFunction } from 'express';
import { fundingSourceService } from '../services/funding-source.service';
import { AppError } from '../middlewares/error.middleware';

export class FundingSourceController {
  /**
   * GET /api/v1/funding-sources (FND-01, FND-04, Bab 6)
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const options = {
        includeArchived: req.query.includeArchived === 'true',
        includeTransactions: req.query.includeTransactions === 'true',
        fundingSourceId: req.query.fundingSourceId as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      };

      const fundingSources = await fundingSourceService.getAll(req.user.id, options);

      return res.status(200).json({
        success: true,
        data: {
          fundingSources,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/funding-sources (FND-01, Bab 6)
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const fundingSource = await fundingSourceService.create(req.user.id, req.body);

      return res.status(201).json({
        success: true,
        message: 'Sumber dana berhasil dibuat',
        data: {
          fundingSource,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/funding-sources/:id (Bab 6)
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const fundingSource = await fundingSourceService.update(
        req.user.id,
        req.params.id,
        req.body
      );

      return res.status(200).json({
        success: true,
        message: 'Sumber dana berhasil diperbarui',
        data: {
          fundingSource,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const fundingSourceController = new FundingSourceController();
