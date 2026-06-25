import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function test() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Querying all users, companies, and roles from the database...');
    const users = await prisma.user.findMany({
      include: {
        role: true,
        company: true
      }
    });

    console.log('--- ALL SYSTEM USERS ---');
    users.forEach(u => {
      console.log(`- Email: ${u.email}`);
      console.log(`  Name: ${u.firstName} ${u.lastName}`);
      console.log(`  Company Name: ${u.company?.name || 'No Company (Independent)'}`);
      console.log(`  Role: ${u.role?.name || 'No Role Assigned'}`);
      console.log(`  Active: ${u.isActive}`);
      console.log('------------------------');
    });
  } catch (err) {
    console.error('ERROR DETECTED:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
