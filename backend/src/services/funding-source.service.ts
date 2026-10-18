import { Types } from 'mongoose';
import { FundingSource, Transaction, Budget } from '../models';
import { AppError } from '../middlewares/error.middleware';
import {
  CreateFundingSourceDTO,
  UpdateFundingSourceDTO,
} from '../../../shared/types/funding-source';

export interface GetFundingSourcesQueryOptions {
  includeArchived?: boolean;
  includeTransactions?: boolean;
  fundingSourceId?: string;
  limit?: number;
}

export class FundingSourceService {
  /**
   * FND-01 & FND-04 (Bab 6): Ambil seluruh Sumber Dana milik user beserta currentBalance
   * dan mendukung riwayat mutasi kronologis per Sumber Dana.
   */
  async getAll(userId: string, options: GetFundingSourcesQueryOptions = {}) {
    // Isolasi ketat userId sesuai AUTH-04
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (options.fundingSourceId) {
      if (!Types.ObjectId.isValid(options.fundingSourceId)) {
        throw new AppError('Format ID sumber dana tidak valid', 400);
      }
      filter._id = new Types.ObjectId(options.fundingSourceId);
    }

    const sources = await FundingSource.find(filter).sort({ createdAt: 1 });

    // Sertakan riwayat mutasi transaksi secara kronologis per Sumber Dana (FND-04)
    const result = await Promise.all(
      sources.map(async (source) => {
        const sourceObj = source.toObject();

        if (options.includeTransactions || options.fundingSourceId) {
          const transactions = await Transaction.find({
            userId: new Types.ObjectId(userId),
            $or: [
              { sourceFundingId: source._id },
              { destinationFundingId: source._id },
            ],
          })
            .populate('storageSpaceId', 'name color icon')
            .populate('budgetId', 'name color icon')
            .populate('sourceFundingId', 'name type color icon')
            .populate('destinationFundingId', 'name type color icon')
            .sort({ transactionDate: -1, createdAt: -1 })
            .limit(options.limit || 50);

          return {
            ...sourceObj,
            transactions,
          };
        }

        // Secara default sertakan ringkasan mutasi terbaru (5 mutasi terakhir)
        const recentTransactions = await Transaction.find({
          userId: new Types.ObjectId(userId),
          $or: [
            { sourceFundingId: source._id },
            { destinationFundingId: source._id },
          ],
        })
          .populate('storageSpaceId', 'name color icon')
          .populate('budgetId', 'name color icon')
          .sort({ transactionDate: -1, createdAt: -1 })
          .limit(5);

        return {
          ...sourceObj,
          recentTransactions,
        };
      })
    );

    return result;
  }

  /**
   * FND-01 (Bab 6): Tambah Sumber Dana baru dengan currentBalance = initialBalance
   */
  async create(userId: string, dto: CreateFundingSourceDTO) {
    const initialBalance = dto.initialBalance || 0;

    const source = await FundingSource.create({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      type: dto.type,
      initialBalance,
      currentBalance: initialBalance,
      color: dto.color.trim(),
      icon: dto.icon.trim(),
      isArchived: false,
    });

    return source;
  }

  /**
   * Perbarui nama, tipe, warna, ikon Sumber Dana
   */
  async update(userId: string, id: string, dto: UpdateFundingSourceDTO) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID sumber dana tidak valid', 400);
    }

    // Isolasi ketat userId sesuai AUTH-04
    const source = await FundingSource.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!source) {
      throw new AppError('Sumber dana tidak ditemukan', 404);
    }

    if (dto.name !== undefined) source.name = dto.name.trim();
    if (dto.type !== undefined) source.type = dto.type;
    if (dto.color !== undefined) source.color = dto.color.trim();
    if (dto.icon !== undefined) source.icon = dto.icon.trim();

    await source.save();
    return source;
  }

  /**
   * Hapus Sumber Dana
   * Menghapus Sumber Dana dan seluruh pos anggaran (Budget) yang terhubung dengannya.
   */
  async delete(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID sumber dana tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const sourceObjId = new Types.ObjectId(id);

    const source = await FundingSource.findOne({
      _id: sourceObjId,
      userId: userObjId,
    });

    if (!source) {
      throw new AppError('Sumber dana tidak ditemukan', 404);
    }

    // 1. Hapus seluruh pos anggaran (Budget) yang terhubung dengan Sumber Dana ini
    await Budget.deleteMany({
      fundingSourceId: sourceObjId,
      userId: userObjId,
    });

    // 2. Hapus dokumen Sumber Dana
    await FundingSource.deleteOne({
      _id: sourceObjId,
      userId: userObjId,
    });

    return { message: 'Sumber dana berhasil dihapus' };
  }
}

export const fundingSourceService = new FundingSourceService();
