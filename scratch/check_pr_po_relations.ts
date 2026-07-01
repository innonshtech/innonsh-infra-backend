import { prisma } from '../src/config/prisma.config';

async function checkRelations() {
  try {
    console.log('Querying Procurement Requests...');
    const requests = await prisma.procurementRequest.findMany({
      include: {
        purchaseOrders: true,
        project: { select: { name: true } }
      }
    });

    console.log(`Found ${requests.length} Procurement Requests:`);
    for (const r of requests) {
      console.log(`- Request: "${r.title}"`);
      console.log(`  ID: ${r.id}`);
      console.log(`  Status: ${r.status}`);
      console.log(`  Linked POs: ${r.purchaseOrders.length}`);
      for (const po of r.purchaseOrders) {
        console.log(`    * PO ID: ${po.id}, PO Number: ${po.poNumber}, Status: ${po.status}, CreatedAt: ${po.createdAt.toISOString()}`);
      }
    }
  } catch (err: any) {
    console.error('Error querying db:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

checkRelations();
