import mongoose, { ClientSession, Types } from 'mongoose';
import { Transaction, FundingSource, StorageSpace, ITransaction, TransactionType } from '../models';
import { AppError } from '../middlewares/error.middleware';
import {
  CreateTransactionDTO,
  UpdateTransactionDTO,
} from '../../../shared/types/transaction';

export class TransactionService {
  /**
   * Eksekutor sesi transaksi MongoDB ACID (Bab 8 PRD)
   */
  private async runInTransaction<T>(
    callback: (session?: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await mongoose.startSession();
    try {
      let result: T;
      await session.withTransaction(async () => {
        result = await callback(session);
      });
      return result!;
    } catch (error: any) {
      // Fallback ramah jika lingkungan development lokal menggunakan standalone MongoDB
      if (
        error.message &&
        (error.message.includes('replica set') ||
          error.message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
          error.message.includes('Transactions are not supported'))
      ) {
        console.warn(
          '[MongoDB] Replica Set tidak terdeteksi (standalone mongod). Menjalankan mutasi saldo secara berurutan tanpa sesi.'
        );
        return await callback(undefined);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * Terapkan efek saldo transaksi ke FundingSource dan StorageSpace (Bab 3 & Bab 4.5)
   */
  private async applyTransactionEffects(
    tx: {
      type: TransactionType;
      amount: number;
      sourceFundingId?: Types.ObjectId | string | null;
      destinationFundingId?: Types.ObjectId | string | null;
      storageSpaceId?: Types.ObjectId | string | null;
      spaceFlowType?: 'IN' | 'OUT' | null;
    },
    userId: string | Types.ObjectId,
    session?: ClientSession
  ) {
    const opts = session ? { session } : {};
    const userObjId = new Types.ObjectId(userId);

    // 1. Dampak mutasi ke Sumber Dana (FundingSource)
    if (tx.type === 'INCOME' && tx.destinationFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
        { $inc: { currentBalance: tx.amount } },
        opts
      );
    } else if (tx.type === 'EXPENSE' && tx.sourceFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
        { $inc: { currentBalance: -tx.amount } },
        opts
      );
    } else if (tx.type === 'TRANSFER') {
      if (tx.sourceFundingId) {
        await FundingSource.updateOne(
          { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
          { $inc: { currentBalance: -tx.amount } },
          opts
        );
      }
      if (tx.destinationFundingId) {
        await FundingSource.updateOne(
          { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
          { $inc: { currentBalance: tx.amount } },
          opts
        );
      }
    } else if (tx.type === 'RECEIVABLE_OUT' && tx.sourceFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
        { $inc: { currentBalance: -tx.amount } },
        opts
      );
    } else if (tx.type === 'RECEIVABLE_IN' && tx.destinationFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
        { $inc: { currentBalance: tx.amount } },
        opts
      );
    }

    // 2. Dampak mutasi ke Ruang Penyimpanan (StorageSpace)
    if (tx.storageSpaceId) {
      const spaceObjId = new Types.ObjectId(tx.storageSpaceId);
      if (tx.spaceFlowType === 'IN') {
        await StorageSpace.updateOne(
          { _id: spaceObjId, userId: userObjId },
          { $inc: { totalIn: tx.amount, currentBalance: tx.amount } },
          opts
        );
      } else if (tx.spaceFlowType === 'OUT') {
        await StorageSpace.updateOne(
          { _id: spaceObjId, userId: userObjId },
          { $inc: { totalOut: tx.amount, currentBalance: -tx.amount } },
          opts
        );
      }
    }
  }

  /**
   * Balikkan (revert/rollback) efek saldo transaksi lama secara atomik (Bab 3 & Bab 4.5)
   */
  private async revertTransactionEffects(
    tx: {
      type: TransactionType;
      amount: number;
      sourceFundingId?: Types.ObjectId | string | null;
      destinationFundingId?: Types.ObjectId | string | null;
      storageSpaceId?: Types.ObjectId | string | null;
      spaceFlowType?: 'IN' | 'OUT' | null;
    },
    userId: string | Types.ObjectId,
    session?: ClientSession
  ) {
    const opts = session ? { session } : {};
    const userObjId = new Types.ObjectId(userId);

    // 1. Kembalikan efek saldo Sumber Dana
    if (tx.type === 'INCOME' && tx.destinationFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
        { $inc: { currentBalance: -tx.amount } },
        opts
      );
    } else if (tx.type === 'EXPENSE' && tx.sourceFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
        { $inc: { currentBalance: tx.amount } },
        opts
      );
    } else if (tx.type === 'TRANSFER') {
      if (tx.sourceFundingId) {
        await FundingSource.updateOne(
          { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
          { $inc: { currentBalance: tx.amount } },
          opts
        );
      }
      if (tx.destinationFundingId) {
        await FundingSource.updateOne(
          { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
          { $inc: { currentBalance: -tx.amount } },
          opts
        );
      }
    } else if (tx.type === 'RECEIVABLE_OUT' && tx.sourceFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.sourceFundingId), userId: userObjId },
        { $inc: { currentBalance: tx.amount } },
        opts
      );
    } else if (tx.type === 'RECEIVABLE_IN' && tx.destinationFundingId) {
      await FundingSource.updateOne(
        { _id: new Types.ObjectId(tx.destinationFundingId), userId: userObjId },
        { $inc: { currentBalance: -tx.amount } },
        opts
      );
    }

    // 2. Kembalikan efek saldo Ruang Penyimpanan
    if (tx.storageSpaceId) {
      const spaceObjId = new Types.ObjectId(tx.storageSpaceId);
      if (tx.spaceFlowType === 'IN') {
        await StorageSpace.updateOne(
          { _id: spaceObjId, userId: userObjId },
          { $inc: { totalIn: -tx.amount, currentBalance: -tx.amount } },
          opts
        );
      } else if (tx.spaceFlowType === 'OUT') {
        await StorageSpace.updateOne(
          { _id: spaceObjId, userId: userObjId },
          { $inc: { totalOut: -tx.amount, currentBalance: tx.amount } },
          opts
        );
      }
    }
  }

  /**
   * Validasi relasi dokumen Sumber Dana dan Ruang Penyimpanan terhadap kepemilikan userId
   */
  private async validateTransactionReferences(
    userId: string,
    data: {
      type: TransactionType;
      sourceFundingId?: string | null;
      destinationFundingId?: string | null;
      storageSpaceId?: string | null;
    }
  ) {
    const userObjId = new Types.ObjectId(userId);

    if (data.type === 'INCOME') {
      if (!data.destinationFundingId) {
        throw new AppError('Sumber dana tujuan wajib dipilih untuk uang masuk', 400);
      }
      const dest = await FundingSource.findOne({
        _id: new Types.ObjectId(data.destinationFundingId),
        userId: userObjId,
      });
      if (!dest) {
        throw new AppError('Sumber dana tujuan tidak ditemukan', 404);
      }
    }

    if (data.type === 'EXPENSE') {
      if (!data.sourceFundingId) {
        throw new AppError('Sumber dana asal wajib dipilih untuk pengeluaran', 400);
      }
      const src = await FundingSource.findOne({
        _id: new Types.ObjectId(data.sourceFundingId),
        userId: userObjId,
      });
      if (!src) {
        throw new AppError('Sumber dana asal tidak ditemukan', 404);
      }
    }

    if (data.type === 'TRANSFER') {
      if (!data.sourceFundingId || !data.destinationFundingId) {
        throw new AppError('Sumber dana asal dan tujuan wajib dipilih untuk transfer', 400);
      }
      if (data.sourceFundingId === data.destinationFundingId) {
        throw new AppError('Sumber dana asal dan tujuan tidak boleh sama', 400);
      }
      const [src, dest] = await Promise.all([
        FundingSource.findOne({ _id: new Types.ObjectId(data.sourceFundingId), userId: userObjId }),
        FundingSource.findOne({ _id: new Types.ObjectId(data.destinationFundingId), userId: userObjId }),
      ]);
      if (!src || !dest) {
        throw new AppError('Salah satu sumber dana transfer tidak ditemukan', 404);
      }
    }

    if (data.type === 'SPACE_ALLOCATION') {
      if (!data.storageSpaceId) {
        throw new AppError('Ruang penyimpanan wajib dipilih untuk alokasi ruang', 400);
      }
    }

    if (data.storageSpaceId) {
      const space = await StorageSpace.findOne({
        _id: new Types.ObjectId(data.storageSpaceId),
        userId: userObjId,
      });
      if (!space) {
        throw new AppError('Ruang penyimpanan tidak ditemukan', 404);
      }
    }
  }

  /**
   * 1. POST /api/v1/transactions (TRX-01, TRX-02, Bab 6)
   * Catat transaksi dan sinkronkan saldo dalam 1 sesi transaksi MongoDB
   */
  async create(userId: string, dto: CreateTransactionDTO) {
    const userObjId = new Types.ObjectId(userId);

    // Normalisasi spaceFlowType berdasarkan jenis transaksi
    let spaceFlowType: 'IN' | 'OUT' | null = dto.spaceFlowType || null;
    if (dto.storageSpaceId) {
      if (dto.type === 'INCOME') {
        spaceFlowType = 'IN';
      } else if (dto.type === 'EXPENSE') {
        spaceFlowType = 'OUT';
      } else if (dto.type === 'SPACE_ALLOCATION' && !spaceFlowType) {
        spaceFlowType = 'IN';
      }
    } else {
      spaceFlowType = null;
    }

    // Validasi keberadaan dan kepemilikan Sumber Dana & Ruang Penyimpanan
    await this.validateTransactionReferences(userId, {
      type: dto.type,
      sourceFundingId: dto.sourceFundingId,
      destinationFundingId: dto.destinationFundingId,
      storageSpaceId: dto.storageSpaceId,
    });

    const transactionData = {
      userId: userObjId,
      type: dto.type,
      amount: dto.amount,
      title: dto.title.trim(),
      notes: dto.notes?.trim(),
      transactionDate: dto.transactionDate || new Date(),
      sourceFundingId: dto.sourceFundingId ? new Types.ObjectId(dto.sourceFundingId) : null,
      destinationFundingId: dto.destinationFundingId
        ? new Types.ObjectId(dto.destinationFundingId)
        : null,
      storageSpaceId: dto.storageSpaceId ? new Types.ObjectId(dto.storageSpaceId) : null,
      spaceFlowType,
      receivableId: dto.receivableId ? new Types.ObjectId(dto.receivableId) : null,
    };

    return await this.runInTransaction(async (session) => {
      // 1. Terapkan efek saldo
      await this.applyTransactionEffects(transactionData, userObjId, session);

      // 2. Simpan dokumen transaksi
      const createdTx = await Transaction.create([transactionData], session ? { session } : {});
      return createdTx[0];
    });
  }

  /**
   * 2. PUT /api/v1/transactions/:id (TRX-03, Bab 6)
   * Ubah transaksi: rollback saldo lama, lalu terapkan efek saldo baru dalam 1 sesi transaksi MongoDB
   */
  async update(userId: string, id: string, dto: UpdateTransactionDTO) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID transaksi tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const txObjId = new Types.ObjectId(id);

    return await this.runInTransaction(async (session) => {
      // Ambil transaksi lama milik user (AUTH-04)
      const oldTx = await Transaction.findOne(
        { _id: txObjId, userId: userObjId },
        null,
        session ? { session } : {}
      );

      if (!oldTx) {
        throw new AppError('Transaksi tidak ditemukan', 404);
      }

      // Gabungkan atribut lama dengan perubahan baru
      const targetType = dto.type || oldTx.type;
      const targetAmount = dto.amount !== undefined ? dto.amount : oldTx.amount;
      const targetTitle = dto.title !== undefined ? dto.title.trim() : oldTx.title;
      const targetNotes = dto.notes !== undefined ? dto.notes?.trim() : oldTx.notes;
      const targetDate = dto.transactionDate || oldTx.transactionDate;

      const targetSourceFundingId =
        dto.sourceFundingId !== undefined
          ? dto.sourceFundingId
            ? new Types.ObjectId(dto.sourceFundingId)
            : null
          : oldTx.sourceFundingId;

      const targetDestinationFundingId =
        dto.destinationFundingId !== undefined
          ? dto.destinationFundingId
            ? new Types.ObjectId(dto.destinationFundingId)
            : null
          : oldTx.destinationFundingId;

      const targetStorageSpaceId =
        dto.storageSpaceId !== undefined
          ? dto.storageSpaceId
            ? new Types.ObjectId(dto.storageSpaceId)
            : null
          : oldTx.storageSpaceId;

      let targetSpaceFlowType =
        dto.spaceFlowType !== undefined ? dto.spaceFlowType : oldTx.spaceFlowType;

      if (targetStorageSpaceId) {
        if (targetType === 'INCOME') targetSpaceFlowType = 'IN';
        else if (targetType === 'EXPENSE') targetSpaceFlowType = 'OUT';
      } else {
        targetSpaceFlowType = null;
      }

      // Validasi referensi baru
      await this.validateTransactionReferences(userId, {
        type: targetType,
        sourceFundingId: targetSourceFundingId ? targetSourceFundingId.toString() : null,
        destinationFundingId: targetDestinationFundingId
          ? targetDestinationFundingId.toString()
          : null,
        storageSpaceId: targetStorageSpaceId ? targetStorageSpaceId.toString() : null,
      });

      const newTxData = {
        type: targetType,
        amount: targetAmount,
        title: targetTitle,
        notes: targetNotes,
        transactionDate: targetDate,
        sourceFundingId: targetSourceFundingId,
        destinationFundingId: targetDestinationFundingId,
        storageSpaceId: targetStorageSpaceId,
        spaceFlowType: targetSpaceFlowType,
        receivableId:
          dto.receivableId !== undefined
            ? dto.receivableId
              ? new Types.ObjectId(dto.receivableId)
              : null
            : oldTx.receivableId,
      };

      // 1. Balikkan efek saldo transaksi lama
      await this.revertTransactionEffects(oldTx, userObjId, session);

      // 2. Terapkan efek saldo transaksi baru
      await this.applyTransactionEffects(newTxData, userObjId, session);

      // 3. Perbarui dokumen transaksi
      await Transaction.updateOne(
        { _id: txObjId, userId: userObjId },
        { $set: newTxData },
        session ? { session } : {}
      );

      const updatedTx = await Transaction.findOne(
        { _id: txObjId, userId: userObjId },
        null,
        session ? { session } : {}
      );

      return updatedTx!;
    });
  }

  /**
   * 3. DELETE /api/v1/transactions/:id (TRX-03, Bab 6)
   * Hapus transaksi dan kembalikan efek saldo lama dalam 1 sesi transaksi MongoDB
   */
  async delete(userId: string, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID transaksi tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const txObjId = new Types.ObjectId(id);

    return await this.runInTransaction(async (session) => {
      const tx = await Transaction.findOne(
        { _id: txObjId, userId: userObjId },
        null,
        session ? { session } : {}
      );

      if (!tx) {
        throw new AppError('Transaksi tidak ditemukan', 404);
      }

      // 1. Kembalikan efek saldo transaksi lama
      await this.revertTransactionEffects(tx, userObjId, session);

      // 2. Hapus dokumen transaksi
      await Transaction.deleteOne(
        { _id: txObjId, userId: userObjId },
        session ? { session } : {}
      );

      return {
        message: 'Transaksi berhasil dihapus dan saldo telah dipulihkan',
      };
    });
  }
}

export const transactionService = new TransactionService();
