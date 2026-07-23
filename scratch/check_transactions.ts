import { prisma } from '../src/config/prisma.config';

async function main() {
  await prisma.contract.update({
    where: { id: 'c76391b8-9787-407f-8292-b857ecb99c56' },
    data: { paidAmount: 20000 }
  });
  console.log('Contract paidAmount updated back to 20000 successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
