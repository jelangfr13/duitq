import { Router } from 'express';
import { transactionController } from '../controllers/transaction.controller';
import { requireAuth, validate, validateQuery } from '../middlewares';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionFilterQuerySchema,
} from '../../../shared/types/transaction';

const router = Router();

// Seluruh endpoint transaksi dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 0. GET /api/v1/transactions (Histori Transaksi, Update v1.2)
 * Ambil histori transaksi dengan filter (search, type, fundingSourceId, storageSpaceId, range date, pagination, summary)
 */
router.get(
  '/',
  validateQuery(transactionFilterQuerySchema),
  (req, res, next) => transactionController.getAll(req, res, next)
);

/**
 * 1. POST /api/v1/transactions (TRX-01, TRX-02, FND-02, FND-03, SPC-02, SPC-03, Bab 6)
 * Catat uang masuk/keluar/pindah dana & sinkronkan saldo dalam 1 sesi transaksi MongoDB
 */
router.post(
  '/',
  validate(createTransactionSchema),
  (req, res, next) => transactionController.create(req, res, next)
);

/**
 * 2. PUT /api/v1/transactions/:id (TRX-03, Bab 6)
 * Ubah transaksi, rollback efek saldo lama, dan terapkan efek saldo baru secara atomik
 */
router.put(
  '/:id',
  validate(updateTransactionSchema),
  (req, res, next) => transactionController.update(req, res, next)
);

/**
 * 3. DELETE /api/v1/transactions/:id (TRX-03, Bab 6)
 * Hapus transaksi dan kembalikan (revert) saldo Sumber Dana & Ruang terkait
 */
router.delete(
  '/:id',
  (req, res, next) => transactionController.delete(req, res, next)
);

export default router;
