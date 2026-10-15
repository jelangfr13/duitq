import mongoose, { ClientSession, Types } from 'mongoose';
import { Receivable, FundingSource, StorageSpace, Transaction } from '../models';
import { AppError } from '../middlewares/error.middleware';
import {
  CreateReceivableDTO,
  RepayReceivableDTO,
} from '../../../shared/types/receivable';

export class ReceivableService {
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
      if (
        error.message &&
        (error.message.includes('replica set') ||
          error.message.includes('Transaction numbers are only allowed on a replica set member or mongos') ||
          error.message.includes('Transactions are not supported'))
      ) {
        console.warn(
          '[MongoDB] Replica Set tidak terdeteksi (standalone mongod). Menjalankan mutasi piutang secara berurutan tanpa sesi.'
        );
        return await callback(undefined);
      }
      throw error;
    } finally {
      await session.endSession();
    }
  }

  /**
   * 18. POST /api/v1/receivables (RCV-02, Bab 6)
   * Catat piutang baru, potong currentBalance Sumber Dana asal, & buat dokumen RECEIVABLE_OUT dalam 1 sesi transaksi MongoDB
   */
  async create(userId: string, dto: CreateReceivableDTO) {
    const userObjId = new Types.ObjectId(userId);

    // Validasi kepemilikan Sumber Dana jika dipilih
    if (dto.sourceFundingId) {
      const srcFunding = await FundingSource.findOne({
        _id: new Types.ObjectId(dto.sourceFundingId),
        userId: userObjId,
      });
      if (!srcFunding) {
        throw new AppError('Sumber dana asal tidak ditemukan', 404);
      }
    }

    // Validasi kepemilikan Ruang Penyimpanan jika dipilih
    if (dto.storageSpaceId) {
      const space = await StorageSpace.findOne({
        _id: new Types.ObjectId(dto.storageSpaceId),
        userId: userObjId,
      });
      if (!space) {
        throw new AppError('Ruang penyimpanan tidak ditemukan', 404);
      }
    }

    return await this.runInTransaction(async (session) => {
      // 1. Buat dokumen Receivable baru
      const receivable = new Receivable({
        userId: userObjId,
        debtorName: dto.debtorName.trim(),
        debtorContact: dto.debtorContact?.trim(),
        title: dto.title.trim(),
        initialAmount: dto.initialAmount,
        paidAmount: 0,
        remainingAmount: dto.initialAmount,
        status: 'UNPAID',
        sourceFundingId: dto.sourceFundingId
          ? new Types.ObjectId(dto.sourceFundingId)
          : null,
        storageSpaceId: dto.storageSpaceId
          ? new Types.ObjectId(dto.storageSpaceId)
          : null,
        loanDate: dto.loanDate || new Date(),
        dueDate: dto.dueDate || null,
        repayments: [],
      });

      await receivable.save(session ? { session } : {});

      // 2. Jika Sumber Dana asal dipilih, potong saldo dan buat transaksi RECEIVABLE_OUT (RCV-02)
      if (dto.sourceFundingId) {
        const sourceFundingObjId = new Types.ObjectId(dto.sourceFundingId);

        // Potong currentBalance Sumber Dana asal sebesar -initialAmount
        await FundingSource.updateOne(
          { _id: sourceFundingObjId, userId: userObjId },
          { $inc: { currentBalance: -dto.initialAmount } },
          session ? { session } : {}
        );

        // Buat dokumen transaksi RECEIVABLE_OUT
        await Transaction.create(
          [
            {
              userId: userObjId,
              type: 'RECEIVABLE_OUT',
              amount: dto.initialAmount,
              title: `Pinjaman ke ${dto.debtorName}: ${dto.title}`,
              notes: dto.debtorContact ? `Kontak: ${dto.debtorContact}` : undefined,
              transactionDate: dto.loanDate || new Date(),
              sourceFundingId: sourceFundingObjId,
              destinationFundingId: null,
              storageSpaceId: dto.storageSpaceId
                ? new Types.ObjectId(dto.storageSpaceId)
                : null,
              spaceFlowType: null,
              receivableId: receivable._id,
            },
          ],
          session ? { session } : {}
        );
      }

      return receivable;
    });
  }

  /**
   * 19. POST /api/v1/receivables/:id/repay (RCV-03, Bab 6)
   * Catat pelunasan/cicilan, tambah currentBalance Sumber Dana tujuan, buat RECEIVABLE_IN,
   * dan mutasikan saldo piutang dalam 1 sesi transaksi MongoDB
   */
  async repay(userId: string, id: string, dto: RepayReceivableDTO) {
    if (!Types.ObjectId.isValid(id)) {
      throw new AppError('Format ID piutang tidak valid', 400);
    }
    if (!Types.ObjectId.isValid(dto.destinationFundingId)) {
      throw new AppError('Format ID sumber dana tujuan tidak valid', 400);
    }

    const userObjId = new Types.ObjectId(userId);
    const receivableObjId = new Types.ObjectId(id);
    const destFundingObjId = new Types.ObjectId(dto.destinationFundingId);

    // Validasi kepemilikan Sumber Dana tujuan
    const destFunding = await FundingSource.findOne({
      _id: destFundingObjId,
      userId: userObjId,
    });
    if (!destFunding) {
      throw new AppError('Sumber dana tujuan tidak ditemukan', 404);
    }

    return await this.runInTransaction(async (session) => {
      // 1. Cari dokumen piutang milik user (AUTH-04)
      const receivable = await Receivable.findOne(
        { _id: receivableObjId, userId: userObjId },
        null,
        session ? { session } : {}
      );

      if (!receivable) {
        throw new AppError('Piutang tidak ditemukan', 404);
      }

      if (receivable.status === 'PAID' || receivable.remainingAmount <= 0) {
        throw new AppError('Piutang ini sudah lunas sepenuhnya', 400);
      }

      if (dto.amount > receivable.remainingAmount) {
        throw new AppError(
          `Nominal pembayaran (Rp${dto.amount.toLocaleString()}) melebihi sisa piutang (Rp${receivable.remainingAmount.toLocaleString()})`,
          400
        );
      }

      // 2. Tambah currentBalance Sumber Dana tujuan sebesar +amount (RCV-03)
      await FundingSource.updateOne(
        { _id: destFundingObjId, userId: userObjId },
        { $inc: { currentBalance: dto.amount } },
        session ? { session } : {}
      );

      // 3. Buat dokumen transaksi RECEIVABLE_IN
      const createdTx = await Transaction.create(
        [
          {
            userId: userObjId,
            type: 'RECEIVABLE_IN',
            amount: dto.amount,
            title: `Pelunasan piutang ${receivable.debtorName}: ${receivable.title}`,
            notes: dto.notes?.trim() || undefined,
            transactionDate: dto.paidAt || new Date(),
            sourceFundingId: null,
            destinationFundingId: destFundingObjId,
            storageSpaceId: receivable.storageSpaceId || null,
            spaceFlowType: null,
            receivableId: receivable._id,
          },
        ],
        session ? { session } : {}
      );

      const transactionId = createdTx[0]._id;

      // 4. Perbarui paidAmount, remainingAmount, status, dan riwayat repayments
      receivable.paidAmount += dto.amount;
      receivable.remainingAmount = receivable.initialAmount - receivable.paidAmount;
      receivable.status = receivable.remainingAmount === 0 ? 'PAID' : 'PARTIAL';

      receivable.repayments.push({
        _id: new Types.ObjectId(),
        amount: dto.amount,
        destinationFundingId: destFundingObjId,
        transactionId,
        paidAt: dto.paidAt || new Date(),
        notes: dto.notes?.trim(),
      });

      await receivable.save(session ? { session } : {});

      return receivable;
    });
  }
}

export const receivableService = new ReceivableService();
