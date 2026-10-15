import { Router } from 'express';
import { receivableController } from '../controllers/receivable.controller';
import { requireAuth, validate } from '../middlewares';
import {
  createReceivableSchema,
  repayReceivableSchema,
} from '../../../shared/types/receivable';

const router = Router();

// Seluruh endpoint piutang dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 18. POST /api/v1/receivables (RCV-02, Bab 6)
 * Catat piutang baru, potong currentBalance Sumber Dana asal, & buat dokumen RECEIVABLE_OUT
 */
router.post(
  '/',
  validate(createReceivableSchema),
  (req, res, next) => receivableController.create(req, res, next)
);

/**
 * 19. POST /api/v1/receivables/:id/repay (RCV-03, Bab 6)
 * Catat pelunasan/cicilan, tambah currentBalance Sumber Dana tujuan, & buat dokumen RECEIVABLE_IN
 */
router.post(
  '/:id/repay',
  validate(repayReceivableSchema),
  (req, res, next) => receivableController.repay(req, res, next)
);

export default router;
