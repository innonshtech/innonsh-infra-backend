import { prisma } from '../src/config/prisma.config';

async function wipeAllTablesToZero() {
  console.log('🧹 Truncating ALL database tables to 0 records...');

  // Execute raw TRUNCATE CASCADE on all public schema tables
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE;';
      END LOOP;
    END $$;
  `);

  console.log('🎉 Database is now 100% EMPTY (0 rows in all tables)!');
  console.log('Users can now click "Register" on the frontend to create their own company & admin account!');
}

wipeAllTablesToZero()
  .catch(e => {
    console.error('❌ Error wiping database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
