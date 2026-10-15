import app from './app';
import { env } from './config/env';
import { connectDatabase } from './config/db';
import { verifyMailConnection } from './config/mail';

const startServer = async () => {
  try {
    await connectDatabase();
    verifyMailConnection(); // Non-blocking check for SMTP readiness
    app.listen(env.PORT, () => {
      console.log(`[DuitQ Server] Running on port ${env.PORT} (${env.NODE_ENV})`);
      console.log(`[DuitQ Server] Health check route: /api/v1/health`);
    });
  } catch (error) {
    console.error('[DuitQ Server] Failed to initialize server:', error);
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
