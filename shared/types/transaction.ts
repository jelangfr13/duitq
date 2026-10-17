import { z } from 'zod';

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'SPACE_ALLOCATION'
  | 'RECEIVABLE_OUT'
  | 'RECEIVABLE_IN';

export interface ITransaction {
  _id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  title: string;
  notes?: string;
  transactionDate: Date | string;
  sourceFundingId?: string | null;
  destinationFundingId?: string | null;
  budgetId?: string | null;
  storageSpaceId?: string | null;
  spaceFlowType?: 'IN' | 'OUT' | null;
  receivableId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const transactionTypeSchema = z.enum([
  'INCOME',
  'EXPENSE',
  'TRANSFER',
  'SPACE_ALLOCATION',
  'RECEIVABLE_OUT',
  'RECEIVABLE_IN',
]);

export const spaceFlowTypeSchema = z.enum(['IN', 'OUT']);

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: z
    .number()
    .int('Nominal transaksi harus berupa bilangan bulat')
    .positive('Nominal transaksi harus lebih dari 0'),
  title: z.string().trim().min(1, 'Judul transaksi wajib diisi'),
  notes: z.string().trim().optional(),
  transactionDate: z.coerce.date().default(() => new Date()),
  sourceFundingId: z.string().nullable().optional(),
  destinationFundingId: z.string().nullable().optional(),
  budgetId: z.string().nullable().optional(),
  storageSpaceId: z.string().nullable().optional(),
  spaceFlowType: spaceFlowTypeSchema.nullable().optional(),
  receivableId: z.string().nullable().optional(),
});

export const updateTransactionSchema = z.object({
  type: transactionTypeSchema.optional(),
  amount: z
    .number()
    .int('Nominal transaksi harus berupa bilangan bulat')
    .positive('Nominal transaksi harus lebih dari 0')
    .optional(),
  title: z.string().trim().min(1, 'Judul transaksi tidak boleh kosong').optional(),
  notes: z.string().trim().optional(),
  transactionDate: z.coerce.date().optional(),
  sourceFundingId: z.string().nullable().optional(),
  destinationFundingId: z.string().nullable().optional(),
  budgetId: z.string().nullable().optional(),
  storageSpaceId: z.string().nullable().optional(),
  spaceFlowType: spaceFlowTypeSchema.nullable().optional(),
  receivableId: z.string().nullable().optional(),
});

export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionDTO = z.infer<typeof updateTransactionSchema>;

export const transactionFilterQuerySchema = z.object({
  search: z.string().trim().optional(),
  type: transactionTypeSchema.optional(),
  fundingSourceId: z.string().optional(),
  budgetId: z.string().optional(),
  storageSpaceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().optional().default(50),
});

export type TransactionFilterQueryDTO = z.infer<typeof transactionFilterQuerySchema>;

export interface ITransactionPopulated
  extends Omit<ITransaction, 'sourceFundingId' | 'destinationFundingId' | 'storageSpaceId' | 'budgetId'> {
  sourceFundingId?: {
    _id: string;
    name: string;
    type: string;
    color: string;
    icon: string;
  } | null;
  destinationFundingId?: {
    _id: string;
    name: string;
    type: string;
    color: string;
    icon: string;
  } | null;
  budgetId?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
    amount?: number;
    spentAmount?: number;
  } | null;
  storageSpaceId?: {
    _id: string;
    name: string;
    color: string;
    icon: string;
  } | null;
}

export interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  count: number;
}

export interface TransactionListResponse {
  transactions: (ITransaction | ITransactionPopulated)[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: TransactionSummary;
}
