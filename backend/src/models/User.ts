import mongoose, { Schema, Types } from 'mongoose';

export interface IUserPreferences {
  currency: 'IDR';
  enableReceivablesModule: boolean;
  hideBalanceDefault: boolean;
}

export interface IUser {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  passwordHash: string;
  preferences: {
    currency: 'IDR';
    enableReceivablesModule: boolean;
    hideBalanceDefault: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const userPreferencesSchema = new Schema<IUserPreferences>(
  {
    currency: {
      type: String,
      enum: ['IDR'],
      default: 'IDR',
      required: true,
    },
    enableReceivablesModule: {
      type: Boolean,
      default: false,
      required: true,
    },
    hideBalanceDefault: {
      type: Boolean,
      default: false,
      required: true,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    preferences: {
      type: userPreferencesSchema,
      default: () => ({
        currency: 'IDR',
        enableReceivablesModule: false,
        hideBalanceDefault: false,
      }),
      required: true,
    },
  },
  {
    timestamps: true,
    collection: 'users',
  }
);

// Indeks MongoDB: { email: 1 } (Unique)
userSchema.index({ email: 1 }, { unique: true });

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema, 'users');
