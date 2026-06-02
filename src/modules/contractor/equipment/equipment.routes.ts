import express from 'express';
import { EquipmentService } from './equipment.service';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';

const router = express.Router();
const service = new EquipmentService();

router.use(authMiddleware, checkERPType(['CONTRACTOR', 'BUILDER']));

// ─── Equipment CRUD ───
router.get('/', async (req: any, res) => {
  try {
    const { projectId, status, type } = req.query;
    const items = await service.getAllEquipment(req.user.company_id, { projectId, status, type });
    res.json({ success: true, data: items });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/stats', async (req: any, res) => {
  try {
    const stats = await service.getEquipmentStats(req.user.company_id);
    res.json({ success: true, data: stats });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req: any, res) => {
  try {
    const item = await service.getEquipmentById(req.params.id, req.user.company_id);
    if (!item) return res.status(404).json({ success: false, message: 'Equipment not found' });
    res.json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req: any, res) => {
  try {
    const item = await service.createEquipment(req.user.company_id, req.body);
    res.status(201).json({ success: true, data: item });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req: any, res) => {
  try {
    await service.updateEquipment(req.params.id, req.user.company_id, req.body);
    res.json({ success: true, message: 'Equipment updated' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req: any, res) => {
  try {
    await service.deleteEquipment(req.params.id, req.user.company_id);
    res.json({ success: true, message: 'Equipment deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Maintenance Logs ───
router.post('/:id/maintenance', async (req: any, res) => {
  try {
    const log = await service.addMaintenanceLog(req.user.company_id, { ...req.body, equipmentId: req.params.id });
    res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Equipment Deployment (Assign to Project) ───
router.get('/deployments/all', async (req: any, res) => {
  try {
    const { projectId, status } = req.query;
    const deployments = await service.getDeployments(req.user.company_id, { projectId, status });
    res.json({ success: true, data: deployments });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/deploy', async (req: any, res) => {
  try {
    const dep = await service.deployEquipment(req.user.company_id, {
      equipmentId: req.params.id,
      projectId: req.body.projectId,
      startDate: req.body.startDate,
      dailyRate: req.body.dailyRate,
      hoursPerDay: req.body.hoursPerDay,
      notes: req.body.notes,
    });
    res.status(201).json({ success: true, data: dep, message: 'Equipment deployed to project' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/deployments/:depId/end', async (req: any, res) => {
  try {
    const result = await service.endDeployment(req.params.depId, req.user.company_id);
    res.json({ success: true, data: result, message: 'Deployment ended and expense recorded' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Fuel / Running Cost Logs ───
router.get('/fuel/all', async (req: any, res) => {
  try {
    const { equipmentId, projectId } = req.query;
    const logs = await service.getFuelLogs(req.user.company_id, { equipmentId, projectId });
    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/fuel', async (req: any, res) => {
  try {
    const log = await service.addFuelLog(req.user.company_id, { ...req.body, equipmentId: req.params.id });
    res.status(201).json({ success: true, data: log });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ─── Depreciation Report ───
router.get('/depreciation/report', async (req: any, res) => {
  try {
    const { prisma } = require('../../../config/prisma.config');
    const ownedEquipment = await (prisma as any).equipment.findMany({
      where: { companyId: req.user.company_id, ownership: 'OWNED', purchaseCost: { gt: 0 } }
    });

    const report = ownedEquipment.map((eq: any) => {
      const cost = eq.purchaseCost || 0;
      const lifeYears = eq.assetLifeYears || 10; // default 10 years
      const method = eq.depreciationMethod || 'SLM';
      const purchaseDate = eq.purchaseDate ? new Date(eq.purchaseDate) : new Date(eq.createdAt);
      const monthsUsed = Math.max(1, Math.floor((Date.now() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));

      let monthlyDep = 0, totalDep = 0, bookValue = cost;

      if (method === 'SLM') {
        // Straight Line: equal depreciation each month
        monthlyDep = cost / (lifeYears * 12);
        totalDep = Math.min(monthlyDep * monthsUsed, cost * 0.95); // 5% salvage
        bookValue = cost - totalDep;
      } else {
        // WDV: 15% annual rate (common in India)
        const annualRate = 0.15;
        const yearsUsed = monthsUsed / 12;
        bookValue = cost * Math.pow(1 - annualRate, yearsUsed);
        totalDep = cost - bookValue;
        monthlyDep = totalDep / Math.max(monthsUsed, 1);
      }

      return {
        id: eq.id, name: eq.name, type: eq.type,
        purchaseCost: cost, purchaseDate, method, lifeYears,
        monthsUsed, monthlyDepreciation: Math.round(monthlyDep),
        totalDepreciation: Math.round(totalDep),
        currentBookValue: Math.round(Math.max(bookValue, 0)),
        depreciationPct: Math.round((totalDep / cost) * 100)
      };
    });

    const totalAssetValue = report.reduce((s: number, r: any) => s + r.purchaseCost, 0);
    const totalBookValue = report.reduce((s: number, r: any) => s + r.currentBookValue, 0);
    const totalDepreciation = report.reduce((s: number, r: any) => s + r.totalDepreciation, 0);

    res.json({
      success: true,
      data: { assets: report, summary: { totalAssetValue, totalBookValue, totalDepreciation } }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;

