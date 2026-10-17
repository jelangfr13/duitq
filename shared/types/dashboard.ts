import { IFundingSource } from './funding-source';
import { IReceivable } from './receivable';
import { ITransaction } from './transaction';
import { IUserPreferences } from './user';

export interface StorageSpaceDistribution {
  _id: string;
  name: string;
  color: string;
  icon: string;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  monthlyBudgetLimit?: number;
  periodExpense: number;
  usagePercentage: number;
}

export interface BudgetDistribution {
  _id: string;
  name: string;
  fundingSourceName: string;
  fundingSourceColor?: string;
  amount: number;
  spentAmount: number;
  remainingAmount: number;
  usagePercentage: number;
  color?: string;
  icon?: string;
}

export interface CashFlowTrendItem {
  date: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  preferences: IUserPreferences;
  summary: {
    totalBalance: number;
    totalIncome: number;
    totalExpense: number;
    netCashFlow: number;
    totalActiveReceivables: number;
    totalBudgetAllocated?: number;
    totalBudgetSpent?: number;
    totalBudgetRemaining?: number;
  };
  budgets?: BudgetDistribution[];
  storageSpaces: StorageSpaceDistribution[];
  cashFlowTrend: CashFlowTrendItem[];
  fundingSources: IFundingSource[];
  activeReceivables: IReceivable[];
  recentTransactions: ITransaction[];
}
