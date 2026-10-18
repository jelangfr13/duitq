import { Types } from 'mongoose';
import { Budget, FundingSource, Transaction } from '../models';
import { CreateBudgetDTO, UpdateBudgetDTO } from '../../../shared/types/budget';
import { AppError } from '../middlewares/error.middleware';

export interface GetBudgetsQueryOptions {
  includeArchived?: boolean;
  fundingSourceId?: string;
}

export class BudgetService {
  /**
   * Ambil seluruh daftar Anggaran (Budget) pengguna beserta kalkulasi alokasi & sisa
   */
  async getAll(userId: string, options: GetBudgetsQueryOptions = {}) {
    const userObjId = new Types.ObjectId(userId);
    const filter: Record<string, any> = { userId: userObjId };

    if (!options.includeArchived) {
      filter.isArchived = false;
    }

    if (options.fundingSourceId && Types.ObjectId.isValid(options.fundingSourceId)) {
      filter.fundingSourceId = new Types.ObjectId(options.fundingSourceId);
    }

    const budgets = await Budget.find(filter)
      .populate('fundingSourceId', '_id name type color icon currentBalance')
      .sort({ createdAt: -1 });

    let totalAllocated = 0;
    let totalSpent = 0;

    const formattedBudgets = budgets.map((b) => {
      const remainingAmount = Math.max(0, b.amount - b.spentAmount);
      const usagePercentage = b.amount > 0 ? Math.round((b.spentAmount / b.amount) * 100) : 0;

      totalAllocated += b.amount;
      totalSpent += b.spentAmount;

      return {
        ...b.toObject(),
        remainingAmount,
        usagePercentage,
      };
    });

    const totalRemaining = Math.max(0, totalAllocated - totalSpent);

    return {
      budgets: formattedBudgets,
      summary: {
        totalAllocated,
        totalSpent,
        totalRemaining,
        count: formattedBudgets.length,
      },
    };
  }

  /**
   * Ambil rincian satu Anggaran berdasarkan ID
   */
  async getById(userId: string, budgetId: string) {
    if (!Types.ObjectId.isValid(budgetId)) {
      throw new AppError('ID anggaran tidak valid', 400);
    }

    const budget = await Budget.findOne({
      _id: new Types.ObjectId(budgetId),
      userId: new Types.ObjectId(userId),
    }).populate('fundingSourceId', '_id name type color icon currentBalance');

    if (!budget) {
      throw new AppError('Anggaran tidak ditemukan', 404);
    }

    const remainingAmount = Math.max(0, budget.amount - budget.spentAmount);
    const usagePercentage = budget.amount > 0 ? Math.round((budget.spentAmount / budget.amount) * 100) : 0;

    return {
      ...budget.toObject(),
      remainingAmount,
      usagePercentage,
    };
  }

  /**
   * Buat Anggaran baru yang terikat ke Sumber Dana tertentu.
   * PENTING: Saldo Sumber Dana TIDAK dipotong saat anggaran dibuat.
   */
  async create(userId: string, dto: CreateBudgetDTO) {
    const userObjId = new Types.ObjectId(userId);

    if (!Types.ObjectId.isValid(dto.fundingSourceId)) {
      throw new AppError('Sumber Dana tidak valid', 400);
    }

    const fundingSource = await FundingSource.findOne({
      _id: new Types.ObjectId(dto.fundingSourceId),
      userId: userObjId,
      isArchived: false,
    });

    if (!fundingSource) {
      throw new AppError('Sumber Dana yang dipilih tidak ditemukan', 404);
    }

    if (dto.amount > fundingSource.currentBalance) {
      throw new AppError(
        `Saldo Sumber Dana (${fundingSource.name}) tidak mencukupi untuk alokasi anggaran ini. Saldo tersedia: Rp ${new Intl.NumberFormat('id-ID').format(fundingSource.currentBalance)}`,
        400
      );
    }

    const budget = await Budget.create({
      userId: userObjId,
      fundingSourceId: fundingSource._id,
      name: dto.name.trim(),
      amount: dto.amount,
      spentAmount: 0,
      color: dto.color || fundingSource.color || '#2563EB',
      icon: dto.icon || 'PieChart',
      description: dto.description || '',
      period: dto.period || 'MONTHLY',
      isArchived: false,
    });

    await budget.populate('fundingSourceId', '_id name type color icon currentBalance');

    const remainingAmount = budget.amount;
    const usagePercentage = 0;

    return {
      ...budget.toObject(),
      remainingAmount,
      usagePercentage,
    };
  }

  /**
   * Perbarui data Anggaran (Nama, Jumlah Alokasi, Warna, Ikon, Deskripsi, Sumber Dana)
   */
  async update(userId: string, budgetId: string, dto: UpdateBudgetDTO) {
    if (!Types.ObjectId.isValid(budgetId)) {
      throw new AppError('ID anggaran tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const budget = await Budget.findOne({
      _id: new Types.ObjectId(budgetId),
      userId: userObjId,
    });

    if (!budget) {
      throw new AppError('Anggaran tidak ditemukan', 404);
    }

    const targetAmount = dto.amount !== undefined ? dto.amount : budget.amount;
    const targetFsId = dto.fundingSourceId || budget.fundingSourceId;

    if (!Types.ObjectId.isValid(targetFsId)) {
      throw new AppError('Sumber Dana tidak valid', 400);
    }

    const fs = await FundingSource.findOne({
      _id: new Types.ObjectId(targetFsId),
      userId: userObjId,
      isArchived: false,
    });

    if (!fs) {
      throw new AppError('Sumber Dana tidak ditemukan', 404);
    }

    if (targetAmount > fs.currentBalance) {
      throw new AppError(
        `Saldo Sumber Dana (${fs.name}) tidak mencukupi untuk alokasi anggaran ini. Saldo tersedia: Rp ${new Intl.NumberFormat('id-ID').format(fs.currentBalance)}`,
        400
      );
    }

    budget.fundingSourceId = fs._id;

    if (dto.name !== undefined) budget.name = dto.name.trim();
    if (dto.amount !== undefined) budget.amount = dto.amount;
    if (dto.color !== undefined) budget.color = dto.color;
    if (dto.icon !== undefined) budget.icon = dto.icon;
    if (dto.description !== undefined) budget.description = dto.description;
    if (dto.period !== undefined) budget.period = dto.period;
    if (dto.isArchived !== undefined) budget.isArchived = dto.isArchived;

    await budget.save();
    await budget.populate('fundingSourceId', '_id name type color icon currentBalance');

    const remainingAmount = Math.max(0, budget.amount - budget.spentAmount);
    const usagePercentage = budget.amount > 0 ? Math.round((budget.spentAmount / budget.amount) * 100) : 0;

    return {
      ...budget.toObject(),
      remainingAmount,
      usagePercentage,
    };
  }

  /**
   * Hapus / Arsipkan Anggaran
   */
  async delete(userId: string, budgetId: string) {
    if (!Types.ObjectId.isValid(budgetId)) {
      throw new AppError('ID anggaran tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const budget = await Budget.findOne({
      _id: new Types.ObjectId(budgetId),
      userId: userObjId,
    });

    if (!budget) {
      throw new AppError('Anggaran tidak ditemukan', 404);
    }

    // Arsipkan anggaran agar riwayat transaksi tetap konsisten
    budget.isArchived = true;
    await budget.save();

    return { message: 'Anggaran berhasil diarsipkan' };
  }

  /**
   * Ambil transaksi pengeluaran yang menggunakan pos anggaran ini
   */
  async getTransactions(userId: string, budgetId: string, page = 1, limit = 50) {
    if (!Types.ObjectId.isValid(budgetId)) {
      throw new AppError('ID anggaran tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const budgetObjId = new Types.ObjectId(budgetId);

    const budget = await Budget.findOne({
      _id: budgetObjId,
      userId: userObjId,
    }).populate('fundingSourceId', '_id name type color icon currentBalance');

    if (!budget) {
      throw new AppError('Anggaran tidak ditemukan', 404);
    }

    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      Transaction.find({
        userId: userObjId,
        budgetId: budgetObjId,
      })
        .populate('sourceFundingId', 'name type color icon')
        .sort({ transactionDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments({
        userId: userObjId,
        budgetId: budgetObjId,
      }),
    ]);

    const remainingAmount = Math.max(0, budget.amount - budget.spentAmount);
    const usagePercentage = budget.amount > 0 ? Math.round((budget.spentAmount / budget.amount) * 100) : 0;

    return {
      budget: {
        ...budget.toObject(),
        remainingAmount,
        usagePercentage,
      },
      transactions,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const budgetService = new BudgetService();
