import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env.config';

// Create a pg Pool with SSL options to allow Supabase self-signed certificates
const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 3, // Limit database connections to 3 to prevent EMAXCONNSESSION on Supabase
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
