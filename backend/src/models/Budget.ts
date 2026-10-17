import mongoose, { Schema, Document, Types } from 'mongoose';
import { IBudget } from '../../../shared/types/budget';

export interface IBudgetDocument extends Omit<IBudget, '_id' | 'userId' | 'fundingSourceId'>, Document {
  userId: Types.ObjectId;
  fundingSourceId: Types.ObjectId;
}

const budgetSchema = new Schema<IBudgetDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    fundingSourceId: {
      type: Schema.Types.ObjectId,
      ref: 'FundingSource',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    color: {
      type: String,
      default: '#2563EB',
    },
    icon: {
      type: String,
      default: 'PieChart',
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    period: {
      type: String,
      enum: ['MONTHLY', 'WEEKLY', 'CUSTOM'],
      default: 'MONTHLY',
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'budgets',
  }
);

budgetSchema.index({ userId: 1, isArchived: 1 });
budgetSchema.index({ userId: 1, fundingSourceId: 1 });

export const Budget =
  mongoose.models.Budget ||
  mongoose.model<IBudgetDocument>('Budget', budgetSchema, 'budgets');
