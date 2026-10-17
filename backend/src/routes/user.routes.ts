import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { requireAuth, validate } from '../middlewares';
import { updatePreferencesSchema } from '../../../shared/types/user';

const router = Router();

// Seluruh rute users dilindungi autentikasi JWT (AUTH-04)
router.use(requireAuth);

/**
 * 1. PATCH /api/v1/users/preferences/receivables (RCV-01, Bab 6)
 * Toggle aktif/nonaktif modul Piutang, privasi saldo, tema, dan profil
 */
router.patch(
  '/preferences/receivables',
  validate(updatePreferencesSchema),
  (req, res, next) => userController.updateProfile(req, res, next)
);

/**
 * 2. PATCH /api/v1/users/preferences (Update v1.2)
 * Update preferensi aplikasi pengguna (mode gelap, tema warna, modul piutang, sembunyikan saldo)
 */
router.patch(
  '/preferences',
  validate(updatePreferencesSchema),
  (req, res, next) => userController.updateProfile(req, res, next)
);

/**
 * 3. PATCH /api/v1/users/profile (Update v1.2)
 * Update profil pengguna (nama lengkap, avatarUrl/foto profil, dan preferensi)
 */
router.patch(
  '/profile',
  validate(updatePreferencesSchema),
  (req, res, next) => userController.updateProfile(req, res, next)
);

/**
 * 4. DELETE /api/v1/users/account
 * Hapus akun dan seluruh data pengguna secara permanen
 */
router.delete('/account', (req, res, next) =>
  userController.deleteAccount(req, res, next)
);

export default router;
