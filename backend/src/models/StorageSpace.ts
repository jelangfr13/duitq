import mongoose, { Schema, Types } from 'mongoose';

export interface IStorageSpace {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  name: string;
  description?: string;
  totalIn: number;
  totalOut: number;
  currentBalance: number;
  monthlyBudgetLimit?: number;
  color: string;
  icon: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const storageSpaceSchema = new Schema<IStorageSpace>(
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
    description: {
      type: String,
      trim: true,
    },
    totalIn: {
      type: Number,
      required: true,
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} harus berupa bilangan bulat',
      },
    },
    totalOut: {
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
    monthlyBudgetLimit: {
      type: Number,
      validate: {
        validator: (v: number | null | undefined) => v == null || Number.isInteger(v),
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
    collection: 'storage_spaces',
  }
);

// Indeks MongoDB: { userId: 1, isArchived: 1 }
storageSpaceSchema.index({ userId: 1, isArchived: 1 });

export const StorageSpace =
  mongoose.models.StorageSpace ||
  mongoose.model<IStorageSpace>('StorageSpace', storageSpaceSchema, 'storage_spaces');
