import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import * as Entities from '../entities';

// Load env: first try apps/api/.env (relative to this file), then root .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // root .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });      // apps/api/.env (takes precedence)

const entitiesList = Object.values(Entities).filter((item) => typeof item === 'function');

const isDev = process.env.NODE_ENV !== 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'chhiyapasal',
  // ⚠️  synchronize is DISABLED — use migrations instead.
  // In dev, TypeORM migrations are run manually; in prod they run automatically on startup.
  synchronize: false,
  logging: isDev ? ['error', 'warn', 'schema'] : ['error'],
  entities: entitiesList,
  // In dev: load .ts migration files; in prod: compiled .js files
  migrations: isDev
    ? [path.join(__dirname, 'migrations/*.ts')]
    : [path.join(__dirname, 'migrations/*.js')],
  migrationsRun: false, // Controlled explicitly in main.ts
  subscribers: [],
});
