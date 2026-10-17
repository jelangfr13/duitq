import { z } from 'zod';
import { IFundingSource } from './funding-source';

export interface IBudget {
  _id: string;
  userId: string;
  name: string;
  fundingSourceId: string | IFundingSource;
  fundingSource?: IFundingSource;
  amount: number;
  spentAmount: number;
  remainingAmount?: number;
  usagePercentage?: number;
  color?: string;
  icon?: string;
  description?: string;
  period?: 'MONTHLY' | 'WEEKLY' | 'CUSTOM';
  isArchived?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export const createBudgetSchema = z.object({
  name: z.string().min(1, 'Nama anggaran wajib diisi').max(50, 'Nama anggaran maksimal 50 karakter'),
  fundingSourceId: z.string().min(1, 'Sumber dana wajib dipilih'),
  amount: z.number().positive('Jumlah alokasi anggaran harus lebih dari 0'),
  color: z.string().optional().default('#2563EB'),
  icon: z.string().optional().default('PieChart'),
  description: z.string().max(200, 'Deskripsi maksimal 200 karakter').optional(),
  period: z.enum(['MONTHLY', 'WEEKLY', 'CUSTOM']).optional().default('MONTHLY'),
});

export const updateBudgetSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  fundingSourceId: z.string().optional(),
  amount: z.number().positive().optional(),
  color: z.string().optional(),
  icon: z.string().optional(),
  description: z.string().max(200).optional(),
  period: z.enum(['MONTHLY', 'WEEKLY', 'CUSTOM']).optional(),
  isArchived: z.boolean().optional(),
});

export type CreateBudgetDTO = z.input<typeof createBudgetSchema>;
export type UpdateBudgetDTO = z.input<typeof updateBudgetSchema>;
