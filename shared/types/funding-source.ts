import { z } from 'zod';

export type FundingSourceType = 'BANK' | 'EWALLET' | 'CASH' | 'OTHER';

export interface IFundingSource {
  _id: string;
  userId: string;
  name: string;
  type: FundingSourceType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  isArchived?: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const fundingSourceTypeSchema = z.enum(['BANK', 'EWALLET', 'CASH', 'OTHER']);

export const createFundingSourceSchema = z.object({
  name: z.string().trim().min(1, 'Nama sumber dana wajib diisi'),
  type: fundingSourceTypeSchema,
  initialBalance: z.number().int('Saldo awal harus berupa bilangan bulat').default(0),
  color: z.string().trim().min(1, 'Warna wajib diisi'),
  icon: z.string().trim().min(1, 'Ikon wajib diisi'),
});

export const updateFundingSourceSchema = z.object({
  name: z.string().trim().min(1, 'Nama sumber dana tidak boleh kosong').optional(),
  type: fundingSourceTypeSchema.optional(),
  color: z.string().trim().min(1, 'Warna tidak boleh kosong').optional(),
  icon: z.string().trim().min(1, 'Ikon tidak boleh kosong').optional(),
  isArchived: z.boolean().optional(),
});

export type CreateFundingSourceDTO = z.infer<typeof createFundingSourceSchema>;
export type UpdateFundingSourceDTO = z.infer<typeof updateFundingSourceSchema>;
