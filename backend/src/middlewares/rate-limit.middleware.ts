import rateLimit from 'express-rate-limit';

/**
 * Rate limiter untuk endpoint login: maksimal 5 request per 15 menit per Bab 8 PRD
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak percobaan masuk. Silakan coba lagi setelah 15 menit.',
  },
});

/**
 * Rate limiter untuk endpoint forgot password: maksimal 5 request per 15 menit per Bab 8 PRD
 */
export const forgotPasswordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Terlalu banyak permintaan pemulihan kata sandi. Silakan coba lagi setelah 15 menit.',
  },
});
