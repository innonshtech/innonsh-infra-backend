import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env.config';

// Prisma v7 uses the client engine, requiring a driver adapter for direct DB connections.
// We use the official @prisma/adapter-pg for PostgreSQL.
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });
