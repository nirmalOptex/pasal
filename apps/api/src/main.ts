import './aliases';
import 'reflect-metadata';
import dotenv from 'dotenv';
import path from 'path';

// Load env file: prefer .env.production in production, else .env
const envFile =
  process.env.NODE_ENV === 'production'
    ? path.resolve(process.cwd(), '.env.production')
    : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envFile });
dotenv.config(); // fallback

// Validate env vars — exits with a clear error if required vars are missing
import { env } from '@config/env';
import { logger } from './logger';
import { AppDataSource } from '@database/data-source';
import { createApp } from './app';

const PORT = parseInt(env.PORT, 10);

async function bootstrap() {
  try {
    await AppDataSource.initialize();
    logger.info('✅ Database connected');

    // Run pending migrations automatically in production
    if (env.NODE_ENV === 'production') {
      const pending = await AppDataSource.showMigrations();
      if (pending) {
        logger.info('⏳ Running pending migrations…');
        await AppDataSource.runMigrations();
        logger.info('✅ Migrations applied');
      }
    }

    const app = createApp();

    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`🚀 ChiyaPasal API running on http://0.0.0.0:${PORT}`);
      logger.info(`   Environment: ${env.NODE_ENV}`);
    });

    // ── Graceful shutdown ────────────────────────────────────────
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received — shutting down gracefully…`);
      server.close(async () => {
        try {
          await AppDataSource.destroy();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (err) {
          logger.error('Error during shutdown', { err });
          process.exit(1);
        }
      });

      // Force exit after 10s if connections don't drain
      setTimeout(() => {
        logger.error('Graceful shutdown timed out — force exiting');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('❌ Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();
