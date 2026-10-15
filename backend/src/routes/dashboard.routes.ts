import { Router } from 'express';
import { dashboardController } from '../controllers/dashboard.controller';
import { requireAuth } from '../middlewares';

const router = Router();

// Seluruh endpoint Dashboard dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 16. GET /api/v1/dashboard/summary (DSH-01..DSH-05, RCV-04, Bab 6 & Bab 8)
 * Agregasi $facet MongoDB untuk total saldo, arus kas, rincian grafik Ruang, Sumber Dana, & Piutang
 */
router.get(
  '/summary',
  (req, res, next) => dashboardController.getSummary(req, res, next)
);

export default router;
