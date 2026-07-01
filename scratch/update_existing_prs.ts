import { prisma } from '../src/config/prisma.config';

async function updateExisting() {
  try {
    console.log('Querying all procurement requests with purchase orders...');
    const requests = await prisma.procurementRequest.findMany({
      include: {
        purchaseOrders: true
      }
    });

    let updatedCount = 0;
    for (const r of requests) {
      if (r.purchaseOrders.length > 0 && r.status !== 'ORDERED') {
        console.log(`Request "${r.title}" (ID: ${r.id}) has ${r.purchaseOrders.length} POs but status is "${r.status}". Updating to ORDERED...`);
        await prisma.procurementRequest.update({
          where: { id: r.id },
          data: { status: 'ORDERED' }
        });
        updatedCount++;
      }
    }
    console.log(`Successfully updated ${updatedCount} legacy requests to ORDERED status.`);
  } catch (err: any) {
    console.error('Error during update:', err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

updateExisting();
