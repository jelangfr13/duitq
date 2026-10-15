import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import {
  requireAuth,
  validate,
  loginRateLimiter,
  forgotPasswordRateLimiter,
} from '../middlewares';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../../../shared/types/user';

const router = Router();

/**
 * 1. POST /api/v1/auth/register (AUTH-01, AUTH-02)
 * Validasi input dengan Zod, hash password bcrypt, buat user di MongoDB
 */
router.post(
  '/register',
  validate(registerSchema),
  (req, res, next) => authController.register(req, res, next)
);

/**
 * 2. POST /api/v1/auth/login (AUTH-03, Bab 8)
 * Rate limit 5 req/15 min, verifikasi kredensial, terbitkan JWT di HttpOnly cookie
 */
router.post(
  '/login',
  loginRateLimiter,
  validate(loginSchema),
  (req, res, next) => authController.login(req, res, next)
);

/**
 * 3. POST /api/v1/auth/logout (AUTH-05, Bab 6)
 * Hapus HttpOnly cookie dan akhiri sesi aktif
 */
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

/**
 * 4. GET /api/v1/auth/me (AUTH-04, Bab 6)
 * Dilindungi requireAuth, ambil profil pengguna aktif & preferensi
 */
router.get(
  '/me',
  requireAuth,
  (req, res, next) => authController.getMe(req, res, next)
);

/**
 * 5. POST /api/v1/auth/forgot-password (PWD-01, PWD-02, Bab 8)
 * Rate limit 5 req/15 min, generate token 15 min TTL, kirim email reset URL, respons generik
 */
router.post(
  '/forgot-password',
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  (req, res, next) => authController.forgotPassword(req, res, next)
);

/**
 * 6. POST /api/v1/auth/reset-password (PWD-03)
 * Verifikasi token hash belum expired, update passwordHash di users, hapus token (one-time use)
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  (req, res, next) => authController.resetPassword(req, res, next)
);

export default router;
