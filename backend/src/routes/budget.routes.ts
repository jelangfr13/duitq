import { Router } from 'express';
import { budgetController } from '../controllers/budget.controller';
import { requireAuth, validate } from '../middlewares';
import { createBudgetSchema, updateBudgetSchema } from '../../../shared/types/budget';

const router = Router();

// Seluruh endpoint anggaran dilindungi oleh requireAuth
router.use(requireAuth);

/**
 * GET /api/v1/budgets - Ambil seluruh pos anggaran beserta alokasi & saldo sisa
 */
router.get('/', (req, res, next) => budgetController.getAll(req, res, next));

/**
 * POST /api/v1/budgets - Buat pos anggaran baru terikat ke Sumber Dana tertentu
 */
router.post(
  '/',
  validate(createBudgetSchema),
  (req, res, next) => budgetController.create(req, res, next)
);

/**
 * GET /api/v1/budgets/:id - Ambil rincian satu pos anggaran
 */
router.get('/:id', (req, res, next) => budgetController.getById(req, res, next));

/**
 * PATCH /api/v1/budgets/:id - Perbarui data pos anggaran
 */
router.patch(
  '/:id',
  validate(updateBudgetSchema),
  (req, res, next) => budgetController.update(req, res, next)
);

/**
 * DELETE /api/v1/budgets/:id - Hapus / Arsipkan pos anggaran
 */
router.delete('/:id', (req, res, next) => budgetController.delete(req, res, next));

/**
 * GET /api/v1/budgets/:id/transactions - Ambil transaksi yang menggunakan pos anggaran ini
 */
router.get('/:id/transactions', (req, res, next) =>
  budgetController.getTransactions(req, res, next)
);

export const budgetRoutes = router;
