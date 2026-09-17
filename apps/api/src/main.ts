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

      // Auto-seed if the database is empty (no businesses exist yet)
      try {
        const count = await AppDataSource.query(
          `SELECT COUNT(*) as cnt FROM businesses`
        );
        const isEmpty = parseInt(count[0]?.cnt ?? '0', 10) === 0;
        if (isEmpty) {
          logger.info('🌱 Empty database detected — running initial seed…');
          // Dynamically import seed to avoid loading it in non-production builds
          const { runSeed } = await import('@database/seeds/run-seed');
          await runSeed(AppDataSource);
          logger.info('✅ Initial seed completed');
        }
      } catch (seedErr) {
        // Non-fatal: seed failure should not crash the server
        logger.warn('⚠️  Auto-seed skipped or failed (non-fatal)', { seedErr });
      }
    }


    const app = createApp();

    const HOST = env.HOST || '0.0.0.0';
    const server = app.listen(PORT, HOST, () => {
      logger.info(`🚀 ChiyaPasal API running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
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
