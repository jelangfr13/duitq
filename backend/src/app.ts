import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { errorHandler } from './middlewares/error.middleware';
import authRoutes from './routes/auth.routes';
import fundingSourceRoutes from './routes/funding-source.routes';
import storageSpaceRoutes from './routes/storage-space.routes';
import transactionRoutes from './routes/transaction.routes';
import dashboardRoutes from './routes/dashboard.routes';
import userRoutes from './routes/user.routes';
import receivableRoutes from './routes/receivable.routes';

const app: Application = express();

// Security headers
app.use(helmet());

// CORS configuration matching PRD Bab 8 & production multi-domain support
const allowedOrigins = (env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (mobile apps, health-checks, curl)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (
        allowedOrigins.includes(cleanOrigin) ||
        allowedOrigins.includes('*') ||
        cleanOrigin.endsWith('.vercel.app')
      ) {
        return callback(null, true);
      }
      return callback(new Error(`CORS error: Origin ${origin} tidak diizinkan oleh sistem DuitQ`));
    },
    credentials: true,
  })
);

// Body and cookie parsing
app.use(express.json());
app.use(cookieParser());

// Base API v1 Router
const apiV1Router = express.Router();

// Health check endpoint
apiV1Router.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'DuitQ REST API v1 is running normally',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// Authentication & Password Recovery Routes (Bab 6 PRD)
apiV1Router.use('/auth', authRoutes);

// Funding Sources Routes (Bab 6 PRD)
apiV1Router.use('/funding-sources', fundingSourceRoutes);

// Storage Spaces Routes (Bab 6 PRD)
apiV1Router.use('/storage-spaces', storageSpaceRoutes);

// Transactions Routes (Bab 6 PRD)
apiV1Router.use('/transactions', transactionRoutes);

// Dashboard Routes (Bab 6 PRD)
apiV1Router.use('/dashboard', dashboardRoutes);

// User Preferences Routes (Bab 6 PRD)
apiV1Router.use('/users', userRoutes);

// Receivables Routes (Bab 6 PRD)
apiV1Router.use('/receivables', receivableRoutes);

// Mount /api/v1 prefix
app.use('/api/v1', apiV1Router);

// Global Error Handler (must be after routes)
app.use(errorHandler);

export default app;
