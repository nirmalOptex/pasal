import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import path from 'path';
import * as Entities from '../entities';

// Load env: first try apps/api/.env, then root .env (dotenv doesn't overwrite existing vars)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });      // apps/api/.env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });   // root .env

const entitiesList = Object.values(Entities).filter((item) => typeof item === 'function');

const isDev = process.env.NODE_ENV !== 'production';
const useSsl = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

const connectionOptions: any = {
  type: 'postgres',
  synchronize: false,
  logging: isDev ? ['error', 'warn', 'schema'] : ['error'],
  entities: entitiesList,
  migrations: isDev
    ? [path.join(__dirname, 'migrations/*.ts')]
    : [path.join(__dirname, 'migrations/*.js')],
  migrationsRun: false, // Controlled explicitly in main.ts
  subscribers: [],
};

if (process.env.DATABASE_URL) {
  connectionOptions.url = process.env.DATABASE_URL;
} else {
  connectionOptions.host = process.env.DB_HOST || 'localhost';
  connectionOptions.port = parseInt(process.env.DB_PORT || '5432', 10);
  connectionOptions.username = process.env.DB_USER || 'postgres';
  connectionOptions.password = process.env.DB_PASSWORD || 'postgres';
  connectionOptions.database = process.env.DB_NAME || 'chhiyapasal';
}

if (useSsl) {
  connectionOptions.ssl = { rejectUnauthorized };
} else {
  connectionOptions.ssl = false;
}

export const AppDataSource = new DataSource(connectionOptions);
