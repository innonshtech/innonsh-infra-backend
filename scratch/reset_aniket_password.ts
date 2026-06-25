import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const newHashedPassword = await bcrypt.hash('Aniket@25', 10);
    console.log("Resetting passwords to 'Aniket@25' for testing...");

    await prisma.user.updateMany({
      where: {
        email: { in: ['aniket.innonsh@gmail.com', 'aniket.innonsh1@gmail.com'] }
      },
      data: {
        password: newHashedPassword
      }
    });

    console.log('Password reset completed successfully!');
  } catch (err) {
    console.error('Password reset failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
