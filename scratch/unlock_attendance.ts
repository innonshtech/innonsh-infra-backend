import { prisma } from '../src/config/prisma.config';

async function main() {
  // Unlock all attendance records
  const result = await (prisma as any).attendance.updateMany({
    data: {
      approvalStatus: 'PENDING',
      approvedById: null,
      approvedAt: null
    }
  });
  console.log(`Successfully unlocked ${result.count} attendance records!`);

  // Delete pending payroll transactions
  const txDel = await (prisma as any).transaction.deleteMany({
    where: {
      category: 'LABOUR_COST',
      status: 'PENDING_APPROVAL'
    }
  });
  console.log(`Deleted ${txDel.count} pending payroll batches!`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
