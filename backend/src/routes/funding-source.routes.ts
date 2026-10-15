import { Router } from 'express';
import { fundingSourceController } from '../controllers/funding-source.controller';
import { requireAuth, validate } from '../middlewares';
import {
  createFundingSourceSchema,
  updateFundingSourceSchema,
} from '../../../shared/types/funding-source';

const router = Router();

// Seluruh endpoint Sumber Dana dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 1. GET /api/v1/funding-sources (FND-01, FND-04, Bab 6)
 * Ambil seluruh daftar Sumber Dana beserta currentBalance dan riwayat mutasi kronologis
 */
router.get('/', (req, res, next) => fundingSourceController.getAll(req, res, next));

/**
 * 2. POST /api/v1/funding-sources (FND-01, Bab 6)
 * Tambah Sumber Dana baru dan inisialisasi currentBalance = initialBalance
 */
router.post(
  '/',
  validate(createFundingSourceSchema),
  (req, res, next) => fundingSourceController.create(req, res, next)
);

/**
 * 3. PATCH /api/v1/funding-sources/:id (Bab 6)
 * Perbarui nama, tipe, warna, ikon Sumber Dana atau arsipkan (isArchived)
 */
router.patch(
  '/:id',
  validate(updateFundingSourceSchema),
  (req, res, next) => fundingSourceController.update(req, res, next)
);

export default router;
