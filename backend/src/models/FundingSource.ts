import mongoose, { Schema, Types } from 'mongoose';

export type FundingSourceType = 'BANK' | 'EWALLET' | 'CASH' | 'OTHER';

export interface IFundingSource {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  type: FundingSourceType;
  initialBalance: number;
  currentBalance: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const fundingSourceSchema = new Schema<IFundingSource>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['BANK', 'EWALLET', 'CASH', 'OTHER'],
      required: true,
    },
    initialBalance: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    currentBalance: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
      trim: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'funding_sources',
  }
);

// Indeks MongoDB: { userId: 1, isArchived: 1 }
fundingSourceSchema.index({ userId: 1, isArchived: 1 });

export const FundingSource =
  mongoose.models.FundingSource ||
  mongoose.model<IFundingSource>('FundingSource', fundingSourceSchema, 'funding_sources');
