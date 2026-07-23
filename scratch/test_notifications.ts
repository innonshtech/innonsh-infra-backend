import { prisma } from '../src/config/prisma.config';

async function testNotifications() {
  console.log('Testing Notifications backend DB models...');

  try {
    // 1. Check if Company table has records
    const companies = await prisma.company.findMany({ take: 1 });
    console.log('Company check success. Found companies:', companies.length);
    if (companies.length === 0) {
      console.log('No company records found in the database.');
      return;
    }
    const companyId = companies[0].id;

    // 2. Try querying Notification table directly
    console.log('Querying Notification table...');
    const notifs = await (prisma as any).notification.findMany({
      where: { companyId },
      take: 5
    });
    console.log('Notification check success. Count:', notifs.length);

    // 3. Try run the generate logic steps
    console.log('Simulating generation logic...');
    
    // Test invoices
    console.log('- Querying invoices...');
    const overdueInvoices = await (prisma as any).invoice.findMany({
      where: { companyId, status: { in: ['SENT', 'OVERDUE'] }, dueDate: { lt: new Date() } }
    });
    console.log('  Invoices found:', overdueInvoices.length);

    // Test equipment
    console.log('- Querying equipment...');
    const rentedEquipment = await (prisma as any).equipment.findMany({
      where: { companyId, ownership: 'RENTED', status: 'OPERATIONAL' }
    });
    console.log('  Rented equipment found:', rentedEquipment.length);

    // Test stock
    console.log('- Querying stock...');
    const lowStock = await (prisma as any).stock.findMany({
      where: { companyId, quantity: { lte: 10 } },
      include: { inventoryItem: true, warehouse: true }
    });
    console.log('  Low stock items found:', lowStock.length);

    console.log('\n--- ALL DB CHECKS PASSED SUCCESSFULLY ---');
  } catch (err: any) {
    console.error('\n--- DATABASE ERROR ENCOUNTERED ---');
    console.error(err.message || err);
  }
}

testNotifications();
