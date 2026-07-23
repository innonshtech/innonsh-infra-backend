import { prisma } from '../src/config/prisma.config';

async function main() {
  const top = await prisma.transaction.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (!top) {
    console.log('No transactions found to delete.');
    return;
  }

  console.log(`Deleting top transaction: ID: ${top.id} | Desc: ${top.description} | Date: ${top.date} | Amount: ${top.amount}`);
  await prisma.transaction.delete({
    where: { id: top.id }
  });
  console.log('Deleted successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
