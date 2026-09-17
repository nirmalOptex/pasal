import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Ensure .env or .env.production is loaded before validation
const envFile = process.env.NODE_ENV === 'production'
  ? path.resolve(process.cwd(), '.env.production')
  : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envFile });
dotenv.config({ path: path.resolve(__dirname, '../../.env') }); // also check apps/api/.env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('4000'),
  HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional().default('localhost'),
  DB_PORT: z.string().regex(/^\d+$/, 'DB_PORT must be a number').default('5432'),
  DB_USER: z.string().optional().default('postgres'),
  DB_PASSWORD: z.string().optional().default(''),
  DB_NAME: z.string().optional().default('chhiyapasal'),
  DB_SSL: z.enum(['true', 'false']).optional().default('false'),
  DB_SSL_REJECT_UNAUTHORIZED: z.enum(['true', 'false']).optional().default('true'),
  ENABLE_FILE_LOGGING: z.enum(['true', 'false']).optional().default('false'),
  JWT_ACCESS_SECRET: z.string().optional(),
  JWT_REFRESH_SECRET: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().optional(),
  SERVE_FRONTEND: z.enum(['true', 'false']).optional().default('false'),
})
.transform((data) => {
  const accessSecret = data.JWT_ACCESS_SECRET || data.JWT_SECRET;
  const refreshSecret = data.JWT_REFRESH_SECRET || data.JWT_SECRET;
  return {
    ...data,
    JWT_ACCESS_SECRET: accessSecret || '',
    JWT_REFRESH_SECRET: refreshSecret || '',
  };
})
.refine((data) => data.JWT_ACCESS_SECRET && data.JWT_ACCESS_SECRET.length >= 16, {
  message: 'JWT_ACCESS_SECRET (or JWT_SECRET) must be set and at least 16 characters',
  path: ['JWT_ACCESS_SECRET'],
});

function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const errors = result.error.errors.map((e) => `  ✗ ${e.path.join('.')}: ${e.message}`);
    console.error('\n❌ Invalid environment variables:\n');
    console.error(errors.join('\n'));
    console.error('\nCheck your .env file and set the missing variables.\n');
    process.exit(1);
  }

  if (!result.data.FRONTEND_URL && result.data.NODE_ENV === 'production') {
    console.warn(
      '⚠️  FRONTEND_URL is not set. CORS is open to all origins. Set this in production!'
    );
  }

  return result.data;
}

export const env = validateEnv();
