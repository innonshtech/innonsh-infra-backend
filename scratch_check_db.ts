import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const counts = {
      companies: await (prisma as any).company.count(),
      projects: await (prisma as any).project.count(),
      users: await (prisma as any).user.count(),
      workers: await (prisma as any).worker.count(),
      equipment: await (prisma as any).equipment.count(),
      invoices: await (prisma as any).invoice.count(),
    };
    console.log('--- DATABASE STATUS ---');
    console.log(JSON.stringify(counts, null, 2));
    console.log('------------------------');
  } catch (err) {
    console.error('Error checking DB:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
