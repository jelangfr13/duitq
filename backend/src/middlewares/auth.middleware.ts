import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface AuthUser {
  id: string;
  email?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Read JWT from HttpOnly cookie per AUTH-03 with Authorization header fallback
    const token =
      req.cookies?.accessToken ||
      req.cookies?.token ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : null);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Sesi autentikasi tidak ditemukan.',
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as {
      id?: string;
      userId?: string;
      email?: string;
    };

    const userId = decoded.id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Token autentikasi tidak valid.',
      });
    }

    // Inject strictly typed user object per AUTH-04
    req.user = {
      id: userId,
      email: decoded.email,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        message: 'Sesi autentikasi telah kedaluwarsa. Silakan masuk kembali.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Token autentikasi tidak valid atau telah dimodifikasi.',
    });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        success: false,
        message: 'Akses ditolak. Sesi autentikasi tidak ditemukan.',
      });
    }

    const adminEmail = (env.DEV_ADMIN_EMAIL || '').toLowerCase().trim();
    if (!adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Konfigurasi developer admin belum diatur di server.',
      });
    }

    let userEmail = req.user.email;
    if (!userEmail) {
      const { User } = await import('../models');
      const user = await User.findById(req.user.id).select('email');
      userEmail = user?.email;
    }

    if (!userEmail || userEmail.toLowerCase().trim() !== adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Akses ditolak. Fitur ini hanya dapat diakses oleh Developer / Super Admin.',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};
