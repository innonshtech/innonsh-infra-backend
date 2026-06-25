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
    console.log('Querying for user with name or email containing aniket...');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'aniket', mode: 'insensitive' } },
          { firstName: { contains: 'aniket', mode: 'insensitive' } },
          { lastName: { contains: 'aniket', mode: 'insensitive' } },
        ]
      },
      include: {
        role: true,
        company: true
      }
    });

    console.log('--- FOUND USERS ---');
    console.log(JSON.stringify(users, null, 2));
    console.log('-------------------');
  } catch (err) {
    console.error('ERROR DETECTED:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

test();
