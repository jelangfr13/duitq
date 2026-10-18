import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Seluruh endpoint admin diproteksi ganda: Autentikasi JWT + Verifikasi Email Dev Admin
router.use(requireAuth);
router.use(requireAdmin);

// 1. Ambil daftar akun pengguna terdaftar
router.get('/users', (req, res, next) => adminController.getAllUsers(req, res, next));

// 2. Reset kata sandi akun pengguna
router.post('/users/:id/reset-password', (req, res, next) =>
  adminController.resetPassword(req, res, next)
);

// 3. Hapus akun pengguna dan seluruh datanya secara permanen
router.delete('/users/:id', (req, res, next) =>
  adminController.deleteUser(req, res, next)
);

export default router;
