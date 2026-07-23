import { prisma } from '../src/config/prisma.config';
import bcrypt from 'bcrypt';

async function wipeDatabaseAndSeedAdmin() {
  console.log('🧹 Starting database wipe to produce a 100% clean slate...');

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

  console.log('✅ All database tables truncated cleanly.');

  // Create Fresh Clean Company
  const company = await prisma.company.create({
    data: {
      name: 'Lokeek Construction Corp',
      erpType: 'CONTRACTOR',
      status: 'ACTIVE',
    },
  });

  // Create Admin Role
  const role = await prisma.role.create({
    data: {
      name: 'Owner',
      permissions: ['*'],
      companyId: company.id,
    },
  });

  // Create SuperAdmin User
  const hashedPassword = await bcrypt.hash('Lokeek@25', 10);
  const user = await prisma.user.create({
    data: {
      email: 'lokeek.inonsh@gmail.com',
      password: hashedPassword,
      firstName: 'Lokeek',
      lastName: 'Inonsh',
      companyId: company.id,
      roleId: role.id,
      permissions: ['*'],
      isActive: true,
    },
  });

  console.log('✨ Fresh Admin Account Created Successfully:');
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: Lokeek@25`);
  console.log(`   Company: ${company.name}`);
  console.log('🎉 Database is now 100% CLEAN and ready for manual testing from scratch!');
}

wipeDatabaseAndSeedAdmin()
  .catch(e => {
    console.error('❌ Error wiping database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
