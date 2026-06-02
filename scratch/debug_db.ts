
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
    console.log('Testing Prisma connection and Worker model...');
    const count = await prisma.worker.count();
    console.log('Worker count:', count);
    
    console.log('Testing create worker...');
    const testWorker = await prisma.worker.create({
      data: {
        firstName: 'Test',
        lastName: 'Worker',
        role: 'Helper',
        dailyWage: 500,
        companyId: 'some-guid-here-if-testing-valid'
      }
    });
    console.log('Created test worker:', testWorker.id);
  } catch (err) {
    console.error('ERROR DETECTED:');
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

test();
