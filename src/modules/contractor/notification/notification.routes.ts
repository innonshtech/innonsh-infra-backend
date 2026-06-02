import express from 'express';
import { prisma } from '@config/prisma.config';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';

const router = express.Router();
router.use(authMiddleware, checkERPType(['CONTRACTOR', 'BUILDER']));

// Get all notifications
router.get('/', async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const userId = req.user.id;

    const notifications = await (prisma as any).notification.findMany({
      where: {
        companyId,
        OR: [{ userId }, { userId: null }]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark single as read
router.patch('/:id/read', async (req: any, res) => {
  try {
    await (prisma as any).notification.updateMany({
      where: { id: req.params.id, companyId: req.user.company_id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Mark all as read
router.patch('/read-all', async (req: any, res) => {
  try {
    await (prisma as any).notification.updateMany({
      where: {
        companyId: req.user.company_id,
        OR: [{ userId: req.user.id }, { userId: null }],
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Auto-generate notifications (called internally or via cron) ───
router.post('/generate', async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    const created: string[] = [];

    // 1. Overdue invoices
    const overdueInvoices = await (prisma as any).invoice.findMany({
      where: { companyId, status: { in: ['SENT', 'OVERDUE'] }, dueDate: { lt: new Date() } }
    });
    for (const inv of overdueInvoices) {
      const exists = await (prisma as any).notification.findFirst({
        where: { companyId, referenceId: inv.id, type: 'OVERDUE_INVOICE' }
      });
      if (!exists) {
        await (prisma as any).notification.create({
          data: {
            companyId, type: 'OVERDUE_INVOICE',
            title: `Invoice ${inv.invoiceNumber} is overdue`,
            message: `₹${inv.dueAmount?.toLocaleString('en-IN')} from ${inv.clientName} is past due date.`,
            referenceId: inv.id, referenceType: 'INVOICE'
          }
        });
        created.push(`OVERDUE_INVOICE: ${inv.invoiceNumber}`);
      }
    }

    // 2. Idle rented equipment (no active deployment for 3+ days)
    const rentedEquipment = await (prisma as any).equipment.findMany({
      where: { companyId, ownership: 'RENTED', status: 'OPERATIONAL' }
    });
    for (const eq of rentedEquipment) {
      const activeDep = await (prisma as any).equipmentDeployment.findFirst({
        where: { equipmentId: eq.id, status: 'ACTIVE' }
      });
      if (!activeDep && eq.dailyRentalRate > 0) {
        const exists = await (prisma as any).notification.findFirst({
          where: { companyId, referenceId: eq.id, type: 'IDLE_EQUIPMENT', isRead: false }
        });
        if (!exists) {
          await (prisma as any).notification.create({
            data: {
              companyId, type: 'IDLE_EQUIPMENT',
              title: `${eq.name} is idle (Rented)`,
              message: `Rented equipment costing ₹${eq.dailyRentalRate}/day is not deployed to any project.`,
              referenceId: eq.id, referenceType: 'EQUIPMENT'
            }
          });
          created.push(`IDLE_EQUIPMENT: ${eq.name}`);
        }
      }
    }

    // 3. Low stock alerts
    const lowStock = await (prisma as any).inventoryItem.findMany({
      where: { companyId, currentStock: { lte: 10 } }
    });
    for (const item of lowStock) {
      const exists = await (prisma as any).notification.findFirst({
        where: { companyId, referenceId: item.id, type: 'LOW_STOCK', isRead: false }
      });
      if (!exists) {
        await (prisma as any).notification.create({
          data: {
            companyId, type: 'LOW_STOCK',
            title: `Low Stock: ${item.name}`,
            message: `Only ${item.currentStock} ${item.unit || 'units'} remaining.`,
            referenceId: item.id, referenceType: 'INVENTORY'
          }
        });
        created.push(`LOW_STOCK: ${item.name}`);
      }
    }

    res.json({ success: true, data: { generated: created.length, details: created } });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
