import { prisma } from '../src/config/prisma.config';

async function main() {
  const topTransactions = await prisma.transaction.findMany({
    orderBy: { date: 'desc' },
    take: 3
  });

  console.log('--- TOP 3 TRANSACTIONS TO BE DELETED ---');
  for (const t of topTransactions) {
    console.log(`ID: ${t.id} | Date: ${t.date} | Amount: ${t.amount} | Description: ${t.description}`);
  }

  if (topTransactions.length > 0) {
    const ids = topTransactions.map(t => t.id);
    const result = await prisma.transaction.deleteMany({
      where: {
        id: { in: ids }
      }
    });
    console.log(`Successfully deleted ${result.count} transactions!`);
  } else {
    console.log('No transactions found to delete.');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
