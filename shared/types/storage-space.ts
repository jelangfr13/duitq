import { z } from 'zod';

export interface IStorageSpace {
  _id: string;
  userId: string;
  name: string;
  description?: string;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  monthlyBudgetLimit?: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const createStorageSpaceSchema = z.object({
  name: z.string().trim().min(1, 'Nama ruang penyimpanan wajib diisi'),
  description: z.string().trim().optional(),
  monthlyBudgetLimit: z
    .number()
    .int('Batas anggaran harus berupa bilangan bulat')
    .nonnegative('Batas anggaran tidak boleh negatif')
    .optional(),
  color: z.string().trim().min(1, 'Warna wajib diisi'),
  icon: z.string().trim().min(1, 'Ikon wajib diisi'),
});

export const updateStorageSpaceSchema = z.object({
  name: z.string().trim().min(1, 'Nama ruang penyimpanan tidak boleh kosong').optional(),
  description: z.string().trim().optional(),
  monthlyBudgetLimit: z
    .number()
    .int('Batas anggaran harus berupa bilangan bulat')
    .nonnegative('Batas anggaran tidak boleh negatif')
    .nullable()
    .optional(),
  color: z.string().trim().min(1, 'Warna tidak boleh kosong').optional(),
  icon: z.string().trim().min(1, 'Ikon tidak boleh kosong').optional(),
  isArchived: z.boolean().optional(),
});

export type CreateStorageSpaceDTO = z.infer<typeof createStorageSpaceSchema>;
export type UpdateStorageSpaceDTO = z.infer<typeof updateStorageSpaceSchema>;
