import { Types } from 'mongoose';
import { StorageSpace, Transaction } from '../models';
import { AppError } from '../middlewares/error.middleware';
import { CreateStorageSpaceDTO } from '../../../shared/types/storage-space';

export interface GetStorageSpacesQueryOptions {
  includeArchived?: boolean;
}

export class StorageSpaceService {
  /**
   * Helper untuk menghitung persentase pemakaian anggaran / saldo ruang
   */
  private calculateUsagePercentage(
    totalIn: number,
    totalOut: number,
    monthlyBudgetLimit?: number
  ): number {
    if (monthlyBudgetLimit && monthlyBudgetLimit > 0) {
      return Number(((totalOut / monthlyBudgetLimit) * 100).toFixed(1));
    }
    if (totalIn > 0) {
      return Number(((totalOut / totalIn) * 100).toFixed(1));
    }
    return 0;
  }

  /**
   * SPC-01 & SPC-04 (Bab 6): Mengambil seluruh Ruang Penyimpanan Kustom milik user
   * beserta totalIn, totalOut, currentBalance, monthlyBudgetLimit, dan persentase pemakaian.
   */
  async getAll(userId: string, options: GetStorageSpacesQueryOptions = {}) {
    // Isolasi ketat userId sesuai AUTH-04
    const filter: Record<string, any> = {
      userId: new Types.ObjectId(userId),
    };

    if (!options.includeArchived) {
      filter.isArchived = false;
    }

    const spaces = await StorageSpace.find(filter).sort({ createdAt: 1 });

    return spaces.map((space) => {
      const usagePercentage = this.calculateUsagePercentage(
        space.totalIn,
        space.totalOut,
        space.monthlyBudgetLimit
      );

      return {
        ...space.toObject(),
        usagePercentage,
      };
    });
  }

  /**
   * SPC-01 (Bab 6): Membuat Ruang Penyimpanan baru dengan totalIn = 0, totalOut = 0, currentBalance = 0
   */
  async create(userId: string, dto: CreateStorageSpaceDTO) {
    const space = await StorageSpace.create({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      description: dto.description?.trim(),
      totalIn: 0,
      totalOut: 0,
      currentBalance: 0,
      monthlyBudgetLimit: dto.monthlyBudgetLimit,
      color: dto.color.trim(),
      icon: dto.icon.trim(),
      isArchived: false,
    });

    return {
      ...space.toObject(),
      usagePercentage: 0,
    };
  }

  /**
   * SPC-02, SPC-03, SPC-04 (Bab 6): Mengambil detail Ruang Penyimpanan beserta
   * mutasi uang masuk (spaceFlowType: 'IN') dan uang keluar (spaceFlowType: 'OUT') secara kronologis.
   */
  async getTransactions(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID ruang penyimpanan tidak valid', 400);
    }

    // Isolasi ketat userId sesuai AUTH-04
    const space = await StorageSpace.findOne({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    });

    if (!space) {
      throw new AppError('Ruang penyimpanan tidak ditemukan', 404);
    }

    const usagePercentage = this.calculateUsagePercentage(
      space.totalIn,
      space.totalOut,
      space.monthlyBudgetLimit
    );

    // Ambil mutasi transaksi khusus ruang ini secara kronologis (terbaru di atas)
    const transactions = await Transaction.find({
      userId: new Types.ObjectId(userId),
      storageSpaceId: new Types.ObjectId(id),
    })
      .populate('sourceFundingId', 'name type color icon')
      .populate('destinationFundingId', 'name type color icon')
      .sort({ transactionDate: -1, createdAt: -1 });

    return {
      storageSpace: {
        ...space.toObject(),
        usagePercentage,
      },
      summary: {
        totalIn: space.totalIn,
        totalOut: space.totalOut,
        currentBalance: space.currentBalance,
        monthlyBudgetLimit: space.monthlyBudgetLimit,
        usagePercentage,
        totalTransactions: transactions.length,
      },
      transactions,
    };
  }
}

export const storageSpaceService = new StorageSpaceService();
