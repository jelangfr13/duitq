import mongoose, { Schema, Types } from 'mongoose';

export type ReceivableStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface IRepaymentItem {
  _id: Types.ObjectId;
  amount: number;
  destinationFundingId: Types.ObjectId;
  transactionId: Types.ObjectId;
  paidAt: Date;
  notes?: string;
}

export interface IReceivable {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  debtorName: string;
  debtorContact?: string;
  title: string;
  initialAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: ReceivableStatus;
  sourceFundingId?: Types.ObjectId | null;
  storageSpaceId?: Types.ObjectId | null;
  loanDate: Date;
  dueDate?: Date | null;
  repayments: IRepaymentItem[];
  createdAt: Date;
  updatedAt: Date;
}

const repaymentItemSchema = new Schema<IRepaymentItem>(
  {
    amount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    destinationFundingId: {
      type: Schema.Types.ObjectId,
      ref: 'FundingSource',
      required: true,
    },
    transactionId: {
      type: Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
    },
    paidAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

const receivableSchema = new Schema<IReceivable>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    debtorName: {
      type: String,
      required: true,
      trim: true,
    },
    debtorContact: {
      type: String,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    initialAmount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    remainingAmount: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    status: {
      type: String,
      enum: ['UNPAID', 'PARTIAL', 'PAID'],
      required: true,
      default: 'UNPAID',
    },
    sourceFundingId: {
      type: Schema.Types.ObjectId,
      ref: 'FundingSource',
      default: null,
    },
    storageSpaceId: {
      type: Schema.Types.ObjectId,
      ref: 'StorageSpace',
      default: null,
    },
    loanDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    repayments: {
      type: [repaymentItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'receivables',
  }
);

// Indeks MongoDB: { userId: 1, status: 1, dueDate: 1 }
receivableSchema.index({ userId: 1, status: 1, dueDate: 1 });

export const Receivable =
  mongoose.models.Receivable ||
  mongoose.model<IReceivable>('Receivable', receivableSchema, 'receivables');
