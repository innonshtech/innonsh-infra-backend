import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

async function cleanData() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Cleaning all operational, transaction, and mock data from database...');

    // Delete in reverse dependency order
    const deleteOperations = [
      { name: 'Attendance', action: () => prisma.attendance.deleteMany() },
      { name: 'AttendanceUpload', action: () => prisma.attendanceUpload.deleteMany() },
      { name: 'EquipmentDeployment', action: () => prisma.equipmentDeployment.deleteMany() },
      { name: 'FuelLog', action: () => prisma.fuelLog.deleteMany() },
      { name: 'MaintenanceLog', action: () => prisma.maintenanceLog.deleteMany() },
      { name: 'Equipment', action: () => prisma.equipment.deleteMany() },
      { name: 'Worker', action: () => prisma.worker.deleteMany() },
      { name: 'BuilderPayment', action: () => prisma.builderPayment.deleteMany() },
      { name: 'BuilderInvoice', action: () => prisma.builderInvoice.deleteMany() },
      { name: 'PaymentMilestone', action: () => prisma.paymentMilestone.deleteMany() },
      { name: 'Booking', action: () => prisma.booking.deleteMany() },
      { name: 'Customer', action: () => prisma.customer.deleteMany() },
      { name: 'UnitHistory', action: () => prisma.unitHistory.deleteMany() },
      { name: 'UnitPriceLog', action: () => prisma.unitPriceLog.deleteMany() },
      { name: 'Unit', action: () => prisma.unit.deleteMany() },
      { name: 'EstimationItem', action: () => prisma.estimationItem.deleteMany() },
      { name: 'ProcurementItem', action: () => prisma.procurementItem.deleteMany() },
      { name: 'ProcurementRequest', action: () => prisma.procurementRequest.deleteMany() },
      { name: 'EstimationVersion', action: () => prisma.estimationVersion.deleteMany() },
      { name: 'Estimation', action: () => prisma.estimation.deleteMany() },
      { name: 'Payment', action: () => prisma.payment.deleteMany() },
      { name: 'InvoiceItem', action: () => prisma.invoiceItem.deleteMany() },
      { name: 'Invoice', action: () => prisma.invoice.deleteMany() },
      { name: 'PurchaseOrderItem', action: () => prisma.purchaseOrderItem.deleteMany() },
      { name: 'PurchaseOrder', action: () => prisma.purchaseOrder.deleteMany() },
      { name: 'StockMovement', action: () => prisma.stockMovement.deleteMany() },
      { name: 'Stock', action: () => prisma.stock.deleteMany() },
      { name: 'Warehouse', action: () => prisma.warehouse.deleteMany() },
      { name: 'InventoryItem', action: () => prisma.inventoryItem.deleteMany() },
      { name: 'Vendor', action: () => prisma.vendor.deleteMany() },
      { name: 'ProjectProgress', action: () => prisma.projectProgress.deleteMany() },
      { name: 'ProjectMember', action: () => prisma.projectMember.deleteMany() },
      { name: 'ProjectTask', action: () => prisma.projectTask.deleteMany() },
      { name: 'Contract', action: () => prisma.contract.deleteMany() },
      { name: 'Notification', action: () => prisma.notification.deleteMany() },
      { name: 'Lead', action: () => prisma.lead.deleteMany() },
      { name: 'Project', action: () => prisma.project.deleteMany() },
      { name: 'WBSTemplate', action: () => prisma.wBSTemplate.deleteMany() },
    ];

    for (const op of deleteOperations) {
      try {
        const result = await op.action();
        console.log(`Deleted all from: ${op.name} (${result.count} records)`);
      } catch (err: any) {
        console.warn(`Warning deleting from ${op.name}:`, err.message || err);
      }
    }

    console.log('\nDatabase cleanup completed successfully! Users, Companies, and Roles are preserved.');
  } catch (err) {
    console.error('Error during cleanup:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

cleanData();
