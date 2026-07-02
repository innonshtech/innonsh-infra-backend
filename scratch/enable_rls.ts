import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function enableRLSOnAllTables() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('--- ENABLING ROW LEVEL SECURITY (RLS) ON ALL TABLES START ---');

    // Run a PostgreSQL block to loop over all public tables and enable RLS
    await prisma.$executeRawUnsafe(`
      DO $$
      DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
          END LOOP;
      END $$;
    `);

    console.log('Successfully enabled Row Level Security (RLS) on all tables in the database!');
    console.log('--- RLS ENABLING COMPLETED SUCCESSFULLY ---');
  } catch (err) {
    console.error('Error enabling RLS:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

enableRLSOnAllTables();
