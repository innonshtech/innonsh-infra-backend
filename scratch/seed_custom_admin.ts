import { prisma } from '../src/config/prisma.config';
import bcrypt from 'bcrypt';

async function seedCustomUser() {
  console.log('🧹 Wiping old data and seeding requested admin credentials...');

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

  // Create Company
  const company = await prisma.company.create({
    data: {
      name: 'innonsh',
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

  // Create User
  const hashedPassword = await bcrypt.hash('testman@100', 10);
  const user = await prisma.user.create({
    data: {
      email: 'testman@gmail.com',
      password: hashedPassword,
      firstName: 'Vaibhav',
      lastName: 'Thorat',
      companyId: company.id,
      roleId: role.id,
      permissions: ['*'],
      isActive: true,
    },
  });

  console.log('✨ Account Created Successfully:');
  console.log(`   Company: ${company.name}`);
  console.log(`   Name: ${user.firstName} ${user.lastName}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Password: testman@100`);
}

seedCustomUser()
  .catch(e => {
    console.error('❌ Error creating account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
