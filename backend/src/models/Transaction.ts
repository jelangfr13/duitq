import mongoose, { Schema, Types } from 'mongoose';

export type TransactionType =
  | 'INCOME'
  | 'EXPENSE'
  | 'TRANSFER'
  | 'SPACE_ALLOCATION'
  | 'RECEIVABLE_OUT'
  | 'RECEIVABLE_IN';

export interface ITransaction {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: TransactionType;
  amount: number;
  title: string;
  notes?: string;
  transactionDate: Date;
  sourceFundingId?: Types.ObjectId | null;
  destinationFundingId?: Types.ObjectId | null;
  budgetId?: Types.ObjectId | null;
  storageSpaceId?: Types.ObjectId | null;
  spaceFlowType?: 'IN' | 'OUT' | null;
  receivableId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: [
        'INCOME',
        'EXPENSE',
        'TRANSFER',
        'SPACE_ALLOCATION',
        'RECEIVABLE_OUT',
        'RECEIVABLE_IN',
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    transactionDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    sourceFundingId: {
      type: Schema.Types.ObjectId,
      ref: 'FundingSource',
      default: null,
    },
    destinationFundingId: {
      type: Schema.Types.ObjectId,
      ref: 'FundingSource',
      default: null,
    },
    budgetId: {
      type: Schema.Types.ObjectId,
      ref: 'Budget',
      default: null,
    },
    storageSpaceId: {
      type: Schema.Types.ObjectId,
      ref: 'StorageSpace',
      default: null,
    },
    spaceFlowType: {
      type: String,
      enum: ['IN', 'OUT', null],
      default: null,
    },
    receivableId: {
      type: Schema.Types.ObjectId,
      ref: 'Receivable',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'transactions',
  }
);

// Indeks MongoDB
transactionSchema.index({ userId: 1, transactionDate: -1 });
transactionSchema.index({ userId: 1, sourceFundingId: 1 });
transactionSchema.index({ userId: 1, destinationFundingId: 1 });
transactionSchema.index({ userId: 1, budgetId: 1 });
transactionSchema.index({ userId: 1, storageSpaceId: 1 });

export const Transaction =
  mongoose.models.Transaction ||
  mongoose.model<ITransaction>('Transaction', transactionSchema, 'transactions');
