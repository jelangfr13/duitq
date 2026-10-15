import { Router } from 'express';
import { storageSpaceController } from '../controllers/storage-space.controller';
import { requireAuth, validate } from '../middlewares';
import { createStorageSpaceSchema } from '../../../shared/types/storage-space';

const router = Router();

// Seluruh endpoint Ruang Penyimpanan dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 4. GET /api/v1/storage-spaces (SPC-01, SPC-04, Bab 6)
 * Ambil seluruh Ruang Penyimpanan Kustom beserta totalIn, totalOut, currentBalance, dan persentase pemakaian
 */
router.get('/', (req, res, next) => storageSpaceController.getAll(req, res, next));

/**
 * 5. POST /api/v1/storage-spaces (SPC-01, Bab 6)
 * Buat Ruang Penyimpanan baru dengan totalIn = 0, totalOut = 0, currentBalance = 0
 */
router.post(
  '/',
  validate(createStorageSpaceSchema),
  (req, res, next) => storageSpaceController.create(req, res, next)
);

/**
 * 6. GET /api/v1/storage-spaces/:id/transactions (SPC-02, SPC-03, SPC-04, Bab 6)
 * Ambil detail Ruang Penyimpanan beserta riwayat mutasi uang masuk (IN) dan keluar (OUT) secara kronologis
 */
router.get(
  '/:id/transactions',
  (req, res, next) => storageSpaceController.getTransactions(req, res, next)
);

export default router;
