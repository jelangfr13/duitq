import { z } from 'zod';

export interface IRepaymentItem {
  _id?: string;
  amount: number;
  destinationFundingId: string;
  transactionId?: string;
  paidAt: Date | string;
  notes?: string;
}

export type ReceivableStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface IReceivable {
  _id: string;
  userId: string;
  debtorName: string;
  debtorContact?: string;
  title: string;
  initialAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: ReceivableStatus;
  sourceFundingId?: string | null;
  storageSpaceId?: string | null;
  loanDate: Date | string;
  dueDate?: Date | string | null;
  repayments: IRepaymentItem[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export const receivableStatusSchema = z.enum(['UNPAID', 'PARTIAL', 'PAID']);

export const repaymentItemSchema = z.object({
  _id: z.string().optional(),
  amount: z
    .number()
    .int('Nominal pembayaran harus berupa bilangan bulat')
    .positive('Nominal pembayaran harus lebih dari 0'),
  destinationFundingId: z.string().trim().min(1, 'Sumber dana tujuan wajib dipilih'),
  transactionId: z.string().optional(),
  paidAt: z.coerce.date(),
  notes: z.string().trim().optional(),
});

export const createReceivableSchema = z.object({
  debtorName: z.string().trim().min(1, 'Nama peminjam wajib diisi'),
  debtorContact: z.string().trim().optional(),
  title: z.string().trim().min(1, 'Keterangan/judul piutang wajib diisi'),
  initialAmount: z
    .number()
    .int('Nominal piutang harus berupa bilangan bulat')
    .positive('Nominal piutang harus lebih dari 0'),
  sourceFundingId: z.string().nullable().optional(),
  storageSpaceId: z.string().nullable().optional(),
  loanDate: z.coerce.date().default(() => new Date()),
  dueDate: z.coerce.date().nullable().optional(),
});

export const repayReceivableSchema = z.object({
  amount: z
    .number()
    .int('Nominal pelunasan harus berupa bilangan bulat')
    .positive('Nominal pelunasan harus lebih dari 0'),
  destinationFundingId: z.string().trim().min(1, 'Sumber dana tujuan wajib dipilih'),
  paidAt: z.coerce.date().default(() => new Date()),
  notes: z.string().trim().optional(),
});

export type CreateReceivableDTO = z.infer<typeof createReceivableSchema>;
export type RepayReceivableDTO = z.infer<typeof repayReceivableSchema>;
