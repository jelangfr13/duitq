import { Types } from 'mongoose';
import {
  User,
  FundingSource,
  StorageSpace,
  Budget,
  Transaction,
  Receivable,
} from '../models';
import { AppError } from '../middlewares/error.middleware';

export interface DashboardFilterQuery {
  startDate?: string;
  endDate?: string;
  period?: 'this_month' | 'last_month' | 'custom' | string;
}

export class DashboardService {
  /**
   * DSH-01 s/d DSH-05, RCV-04, Bab 6 & Bab 8:
   * Mengambil agregasi lengkap Dashboard dalam 1 panggilan HTTP menggunakan MongoDB Aggregation Pipeline ($facet)
   */
  async getSummary(userId: string, query: DashboardFilterQuery = {}) {
    const userObjId = new Types.ObjectId(userId);

    // 1. Tentukan rentang waktu aktif (DSH-05: Bulan Ini, Bulan Lalu, Kustom)
    const now = new Date();
    let start: Date;
    let end: Date;

    if (query.period === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (query.startDate && query.endDate) {
      start = new Date(query.startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(query.endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // Default: Bulan Ini
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    // 2. Eksekusi query paralel dengan isolasi ketat userId (AUTH-04 & Bab 8)
    const [
      user,
      fundingSources,
      storageSpaces,
      budgets,
      activeReceivables,
      recentTransactions,
      aggregationResult,
    ] = await Promise.all([
      User.findById(userObjId).select('preferences fullName email'),
      FundingSource.find({ userId: userObjId }).sort({ createdAt: 1 }),
      StorageSpace.find({ userId: userObjId, isArchived: false }).sort({ createdAt: 1 }),
      Budget.find({ userId: userObjId, isArchived: false })
        .populate('fundingSourceId', 'name color')
        .sort({ createdAt: -1 }),
      Receivable.find({
        userId: userObjId,
        status: { $in: ['UNPAID', 'PARTIAL'] },
      }).sort({ dueDate: 1, createdAt: -1 }),
      Transaction.find({ userId: userObjId })
        .populate('sourceFundingId', 'name color icon type')
        .populate('destinationFundingId', 'name color icon type')
        .populate('budgetId', 'name color icon')
        .populate('storageSpaceId', 'name color icon')
        .sort({ transactionDate: -1, createdAt: -1 })
        .limit(10),
      // MongoDB Aggregation Pipeline ($facet) per Bab 8
      Transaction.aggregate([
        {
          $match: {
            userId: userObjId,
            transactionDate: { $gte: start, $lte: end },
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: '$type',
                  totalAmount: { $sum: '$amount' },
                  count: { $sum: 1 },
                },
              },
            ],
            cashFlowTrend: [
              {
                $group: {
                  _id: {
                    date: {
                      $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' },
                    },
                    type: '$type',
                  },
                  total: { $sum: '$amount' },
                },
              },
              {
                $sort: { '_id.date': 1 },
              },
            ],
            spaceExpenses: [
              {
                $match: {
                  storageSpaceId: { $ne: null },
                  $or: [{ type: 'EXPENSE' }, { spaceFlowType: 'OUT' }],
                },
              },
              {
                $group: {
                  _id: '$storageSpaceId',
                  periodExpense: { $sum: '$amount' },
                },
              },
            ],
          },
        },
      ]),
    ]);

    if (!user) {
      throw new AppError('Pengguna tidak ditemukan', 404);
    }

    const facetData = aggregationResult[0] || {
      summary: [],
      cashFlowTrend: [],
      spaceExpenses: [],
    };

    // 3. Hitung Ringkasan Saldo Utama (DSH-01)
    const totalBalance = fundingSources.reduce(
      (acc, fs) => acc + (fs.currentBalance || 0),
      0
    );

    let totalIncome = 0;
    let totalExpense = 0;

    for (const item of facetData.summary) {
      if (item._id === 'INCOME') {
        totalIncome += item.totalAmount;
      } else if (item._id === 'EXPENSE') {
        totalExpense += item.totalAmount;
      }
    }

    const netCashFlow = totalIncome - totalExpense;

    // 4. Hitung Komposisi Piutang Aktif (DSH-04, RCV-04)
    const totalActiveReceivables = activeReceivables.reduce(
      (acc, r) => acc + (r.remainingAmount || 0),
      0
    );

    // 5. Olah Data Grafik Distribusi Ruang Penyimpanan (DSH-02)
    const spaceExpensesMap = new Map<string, number>();
    for (const se of facetData.spaceExpenses) {
      if (se._id) {
        spaceExpensesMap.set(se._id.toString(), se.periodExpense);
      }
    }

    const spaceDistribution = storageSpaces.map((space) => {
      const periodExpense = spaceExpensesMap.get(space._id.toString()) || 0;
      const usagePercentage =
        space.monthlyBudgetLimit && space.monthlyBudgetLimit > 0
          ? Number(((space.totalOut / space.monthlyBudgetLimit) * 100).toFixed(1))
          : space.totalIn > 0
          ? Number(((space.totalOut / space.totalIn) * 100).toFixed(1))
          : 0;

      return {
        _id: space._id,
        name: space.name,
        color: space.color,
        icon: space.icon,
        totalIn: space.totalIn,
        totalOut: space.totalOut,
        currentBalance: space.currentBalance,
        monthlyBudgetLimit: space.monthlyBudgetLimit,
        periodExpense,
        usagePercentage,
      };
    });

    // 6. Olah Data Grafik Perbandingan Arus Kas Harian (DSH-03)
    const cashFlowTrendMap = new Map<
      string,
      { date: string; income: number; expense: number; net: number }
    >();

    for (const trend of facetData.cashFlowTrend) {
      const dateStr = trend._id.date;
      if (!cashFlowTrendMap.has(dateStr)) {
        cashFlowTrendMap.set(dateStr, {
          date: dateStr,
          income: 0,
          expense: 0,
          net: 0,
        });
      }

      const entry = cashFlowTrendMap.get(dateStr)!;
      if (trend._id.type === 'INCOME') {
        entry.income += trend.total;
      } else if (trend._id.type === 'EXPENSE') {
        entry.expense += trend.total;
      }
      entry.net = entry.income - entry.expense;
    }

    const cashFlowTrend = Array.from(cashFlowTrendMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );

    // 7. Olah Data Budgeting & Alokasi Anggaran
    let totalBudgetAllocated = 0;
    let totalBudgetSpent = 0;

    const budgetDistribution = budgets.map((b) => {
      const fs = b.fundingSourceId as any;
      totalBudgetAllocated += b.amount;
      totalBudgetSpent += b.spentAmount;
      const remainingAmount = Math.max(0, b.amount - b.spentAmount);
      const usagePercentage = b.amount > 0 ? Math.round((b.spentAmount / b.amount) * 100) : 0;
      return {
        _id: b._id.toString(),
        name: b.name,
        fundingSourceName: fs?.name || 'Sumber Dana',
        fundingSourceColor: fs?.color || '#2563EB',
        amount: b.amount,
        spentAmount: b.spentAmount,
        remainingAmount,
        usagePercentage,
        color: b.color,
        icon: b.icon,
      };
    });

    const totalBudgetRemaining = Math.max(0, totalBudgetAllocated - totalBudgetSpent);

    return {
      period: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      preferences: user.preferences,
      summary: {
        totalBalance,
        totalIncome,
        totalExpense,
        netCashFlow,
        totalActiveReceivables,
        totalBudgetAllocated,
        totalBudgetSpent,
        totalBudgetRemaining,
      },
      budgets: budgetDistribution,
      storageSpaces: spaceDistribution,
      cashFlowTrend,
      fundingSources,
      activeReceivables,
      recentTransactions,
    };
  }
}

export const dashboardService = new DashboardService();
