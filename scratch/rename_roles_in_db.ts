import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log("Renaming existing company roles from 'SuperAdmin' to 'Admin'...");
    
    // Find all roles named 'SuperAdmin' that are linked to a company
    const rolesToRename = await prisma.role.findMany({
      where: {
        name: 'SuperAdmin',
        companyId: { not: null }
      }
    });

    console.log(`Found ${rolesToRename.length} roles to rename.`);

    for (const role of rolesToRename) {
      await prisma.role.update({
        where: { id: role.id },
        data: { name: 'Admin' }
      });
      console.log(`Updated role ID ${role.id} (Company: ${role.companyId}) to 'Admin'.`);
    }

    console.log('Role renaming completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

run();
