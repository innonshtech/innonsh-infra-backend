import express from 'express';
import { prisma } from '@config/prisma.config';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';

const router = express.Router();
router.use(authMiddleware, checkERPType(['CONTRACTOR', 'BUILDER']));

// ─── Get All Contracts ───
router.get('/', async (req: any, res) => {
  try {
    const { projectId, status, partyType } = req.query;
    const where: any = { companyId: req.user.company_id };
    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (partyType) where.partyType = partyType;

    const contracts = await (prisma as any).contract.findMany({
      where,
      include: { project: { select: { name: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: contracts });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Get Contract by ID ───
router.get('/:id', async (req: any, res) => {
  try {
    const contract = await (prisma as any).contract.findFirst({
      where: { id: req.params.id, companyId: req.user.company_id },
      include: { project: { select: { name: true } } }
    });
    if (!contract) return res.status(404).json({ success: false, message: 'Contract not found' });
    res.json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Create Contract ───
router.post('/', async (req: any, res) => {
  try {
    const companyId = req.user.company_id;
    // Auto-generate contract number: CON-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const latest = await (prisma as any).contract.findFirst({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
      select: { contractNumber: true }
    });
    let seq = '0001';
    if (latest && latest.contractNumber.includes(dateStr)) {
      const lastSeq = parseInt(latest.contractNumber.split('-').pop() || '0');
      seq = (lastSeq + 1).toString().padStart(4, '0');
    }
    const contractNumber = `CON-${dateStr}-${seq}`;

    const retentionAmount = ((req.body.totalValue || 0) * (req.body.retentionPercent || 0)) / 100;

    const contract = await (prisma as any).contract.create({
      data: {
        companyId,
        contractNumber,
        title: req.body.title,
        partyName: req.body.partyName,
        partyType: req.body.partyType || 'SUB_CONTRACTOR',
        type: req.body.type || 'WORK_ORDER',
        description: req.body.description,
        totalValue: req.body.totalValue || 0,
        retentionPercent: req.body.retentionPercent || 0,
        retentionAmount,
        startDate: req.body.startDate ? new Date(req.body.startDate) : null,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        status: req.body.status || 'DRAFT',
        terms: req.body.terms,
        projectId: req.body.projectId || null,
      }
    });
    res.status(201).json({ success: true, data: contract });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Update Contract ───
router.patch('/:id', async (req: any, res) => {
  try {
    const { linkedTaskId, ...updateFields } = req.body;
    const data = { ...updateFields };
    if (data.startDate !== undefined) {
      data.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      data.endDate = data.endDate ? new Date(data.endDate) : null;
    }
    if (data.totalValue && data.retentionPercent !== undefined) {
      data.retentionAmount = (data.totalValue * data.retentionPercent) / 100;
    }

    // Verify company ownership first for security
    const existing = await (prisma as any).contract.findFirst({
      where: { id: req.params.id, companyId: req.user.company_id }
    });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Contract not found' });
    }

    await (prisma as any).contract.update({
      where: { id: req.params.id },
      data
    });
    res.json({ success: true, message: 'Contract updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Delete Contract ───
router.delete('/:id', async (req: any, res) => {
  try {
    await (prisma as any).contract.deleteMany({
      where: { id: req.params.id, companyId: req.user.company_id }
    });
    res.json({ success: true, message: 'Contract deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
