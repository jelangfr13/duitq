import { Request, Response, NextFunction, CookieOptions } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { AppError } from '../middlewares/error.middleware';

const isProduction = env.NODE_ENV === 'production';

const getBaseCookieOptions = (): CookieOptions => {
  const sameSiteConfig = env.COOKIE_SAME_SITE;
  const sameSite: 'lax' | 'none' | 'strict' =
    sameSiteConfig === 'none' || sameSiteConfig === 'strict' || sameSiteConfig === 'lax'
      ? sameSiteConfig
      : isProduction
      ? 'none'
      : 'lax';

  return {
    httpOnly: true,
    secure: isProduction || sameSite === 'none',
    sameSite,
    path: '/',
  };
};

export class AuthController {
  /**
   * POST /api/v1/auth/register (AUTH-01, AUTH-02)
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      return res.status(201).json({
        success: true,
        message: 'Registrasi berhasil. Silakan masuk ke akun Anda.',
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login (AUTH-03, Bab 8)
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, accessToken, refreshToken } = await authService.login(req.body);

      // Terbitkan accessToken dan refreshToken di dalam HttpOnly, Secure, SameSite=Lax Cookie (AUTH-03)
      res.cookie('accessToken', accessToken, {
        ...getBaseCookieOptions(),
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 hari
      });

      res.cookie('refreshToken', refreshToken, {
        ...getBaseCookieOptions(),
        maxAge: 1 * 24 * 60 * 60 * 1000, // 1 hari
      });

      return res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: {
          user,
          accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout (AUTH-05, Bab 6)
   */
  async logout(_req: Request, res: Response, next: NextFunction) {
    try {
      const cookieOptions = getBaseCookieOptions();
      res.clearCookie('accessToken', cookieOptions);
      res.clearCookie('refreshToken', cookieOptions);
      res.clearCookie('token', cookieOptions);

      return res.status(200).json({
        success: true,
        message: 'Logout berhasil. Sesi telah diakhiri.',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me (AUTH-04, Bab 6)
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user?.id) {
        throw new AppError('Akses ditolak. Sesi autentikasi tidak ditemukan.', 401);
      }

      const user = await authService.getMe(req.user.id);
      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password (PWD-01, PWD-02, Bab 8)
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.forgotPassword(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
        data: result.resetUrl ? { resetUrl: result.resetUrl } : undefined,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password (PWD-03)
   */
  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      return res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
