import express from 'express';
import { ProjectController } from './project.controller';
import { TaskController } from './task.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';
import { allowPermissions } from '../../../middleware/rbac.middleware';

const router = express.Router();
const controller = new ProjectController();

// All project routes require CONTRACTOR ERP type
const contractorGuard = checkERPType(['CONTRACTOR']);

/**
 * @swagger
 * tags:
 *   name: Contractor Projects
 *   description: Project management for contractors
 */

/**
 * @swagger
 * /api/v1/contractor/projects:
 *   get:
 *     summary: Get all projects
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), controller.getAllProjects);

/**
 * @swagger
 * /api/v1/contractor/projects/dashboard:
 *   get:
 *     summary: Get project dashboard data
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics and recent projects
 */
router.get('/dashboard', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), controller.getDashboardData);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), controller.getProjectById);

/**
 * @swagger
 * /api/v1/contractor/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [PLANNED, IN_PROGRESS, COMPLETED, ON_HOLD] }
 *               budget: { type: number }
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', authMiddleware, contractorGuard, allowPermissions(['projects.create', 'projects.manage']), controller.createProject);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}:
 *   patch:
 *     summary: Update project details
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project updated
 */
router.patch('/:id', authMiddleware, contractorGuard, allowPermissions(['projects.update', 'projects.manage']), controller.updateProject);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.delete('/:id', authMiddleware, contractorGuard, allowPermissions(['projects.delete', 'projects.manage']), controller.deleteProject);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}/members:
 *   post:
 *     summary: Add member to project
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [userId]
 *             properties:
 *               userId: { type: string, format: uuid }
 *               role: { type: string }
 *     responses:
 *       201:
 *         description: Member added
 */
router.post('/:id/members', authMiddleware, contractorGuard, allowPermissions('projects.manage'), controller.addMember);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}/members/{userId}:
 *   delete:
 *     summary: Remove member from project
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Member removed
 */
router.delete('/:id/members/:userId', authMiddleware, contractorGuard, allowPermissions('projects.manage'), controller.removeMember);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}/progress:
 *   post:
 *     summary: Update project progress
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [percentage]
 *             properties:
 *               percentage: { type: number, minimum: 0, maximum: 100 }
 *               statusUpdate: { type: string }
 *     responses:
 *       201:
 *         description: Progress updated
 */
router.post('/:id/progress', authMiddleware, contractorGuard, allowPermissions(['projects.update', 'projects.manage']), controller.updateProgress);

/**
 * @swagger
 * /api/v1/contractor/projects/{id}/progress:
 *   get:
 *     summary: Get progress history
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of progress updates
 */
router.get('/:id/progress', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), controller.getProjectProgress);

// --- Task / WBS Routes ---
const taskController = new TaskController();

/**
 * @swagger
 * /api/v1/contractor/projects/{projectId}/tasks:
 *   get:
 *     summary: Get project WBS tasks (tree structure)
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:projectId/tasks', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), taskController.getTasks);

/**
 * @swagger
 * /api/v1/contractor/projects/{projectId}/tasks:
 *   post:
 *     summary: Create a new WBS task
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 */
router.post('/:projectId/tasks', authMiddleware, contractorGuard, allowPermissions(['projects.update', 'projects.manage']), taskController.createTask);

/**
 * @swagger
 * /api/v1/contractor/projects/tasks/{id}:
 *   patch:
 *     summary: Update a WBS task
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 */
router.patch('/tasks/:id', authMiddleware, contractorGuard, allowPermissions(['projects.update', 'projects.manage']), taskController.updateTask);

/**
 * @swagger
 * /api/v1/contractor/projects/tasks/{id}:
 *   delete:
 *     summary: Delete a WBS task
 *     tags: [Contractor Projects]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/tasks/:id', authMiddleware, contractorGuard, allowPermissions(['projects.update', 'projects.manage']), taskController.deleteTask);

// ─── Project Financial Breakdown ───
router.get('/:id/financials', authMiddleware, contractorGuard, allowPermissions(['projects.view', 'projects.manage']), async (req: any, res, next) => {
  try {
    const projectId = req.params.id;
    const companyId = req.user.company_id;
    const { prisma } = require('../../../config/prisma.config');

    // Fetch project with budget
    const project = await (prisma as any).project.findFirst({
      where: { id: projectId, companyId },
      select: { id: true, name: true, budget: true, area: true, status: true }
    });
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });

    // Parallel fetch all cost sources
    const [
      // Labour wages from attendance
      attendanceRecords,
      // Equipment deployments (rental cost)
      deployments,
      // Fuel logs
      fuelLogs,
      // Maintenance logs from equipment assigned to this project
      maintenanceLogs,
      // Purchase Orders received for this project (via procurement requests)
      procurementRequests,
      // Stock movements into this project (material cost)
      stockMovements,
      // Invoices (income)
      invoices,
      // Contracts for this project
      contracts,
    ] = await Promise.all([
      (prisma as any).attendance.findMany({
        where: { companyId, projectId },
        select: { wageAmount: true, date: true }
      }),
      (prisma as any).equipmentDeployment.findMany({
        where: { companyId, projectId },
        include: { equipment: { select: { name: true, type: true } } }
      }),
      (prisma as any).fuelLog.findMany({
        where: { companyId, projectId },
        select: { totalCost: true, date: true }
      }),
      (prisma as any).maintenanceLog.findMany({
        where: {
          companyId,
          equipment: { projectId }
        },
        select: { cost: true, date: true }
      }),
      (prisma as any).procurementRequest.findMany({
        where: { companyId, projectId },
        include: {
          purchaseOrders: {
            where: { status: 'RECEIVED' },
            select: { totalAmount: true, vendor: { select: { name: true } } }
          }
        }
      }),
      (prisma as any).stockMovement.findMany({
        where: { companyId, projectId, type: 'OUT' },
        include: { inventoryItem: { select: { name: true } } }
      }),
      (prisma as any).invoice.findMany({
        where: { companyId, projectId },
        select: { totalAmount: true, paidAmount: true, dueAmount: true, status: true }
      }),
      (prisma as any).contract.findMany({
        where: { companyId, projectId },
        select: { totalValue: true, paidAmount: true, partyName: true, status: true }
      }),
    ]);

    // ─── Calculate Category-wise Expenses ───
    const labourCost = attendanceRecords.reduce((s: number, r: any) => s + (r.wageAmount || 0), 0);

    // Equipment rental = sum of totalCost for completed + estimated for active
    let equipmentRentalCost = 0;
    for (const dep of deployments) {
      if (dep.status === 'COMPLETED') {
        equipmentRentalCost += dep.totalCost || 0;
      } else {
        // Active: calculate estimated cost so far
        const days = Math.ceil((new Date().getTime() - new Date(dep.startDate).getTime()) / (1000 * 60 * 60 * 24));
        equipmentRentalCost += days * (dep.dailyRate || 0);
      }
    }

    const equipmentFuelCost = fuelLogs.reduce((s: number, r: any) => s + (r.totalCost || 0), 0);
    const equipmentMaintenanceCost = maintenanceLogs.reduce((s: number, r: any) => s + (r.cost || 0), 0);
    const totalEquipmentCost = equipmentRentalCost + equipmentFuelCost + equipmentMaintenanceCost;

    // Material / Vendor cost from POs
    let materialCost = 0;
    const vendorBreakdown: Record<string, number> = {};
    for (const pr of procurementRequests) {
      for (const po of pr.purchaseOrders) {
        materialCost += po.totalAmount || 0;
        const vendorName = po.vendor?.name || 'Unknown Vendor';
        vendorBreakdown[vendorName] = (vendorBreakdown[vendorName] || 0) + (po.totalAmount || 0);
      }
    }

    // Contract costs
    const contractCost = contracts.reduce((s: number, c: any) => s + (c.paidAmount || 0), 0);

    // Total Expenses
    const totalExpenses = labourCost + totalEquipmentCost + materialCost + contractCost;

    // Income from invoices
    const totalInvoiced = invoices.reduce((s: number, i: any) => s + (i.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((s: number, i: any) => s + (i.paidAmount || 0), 0);
    const totalDue = invoices.reduce((s: number, i: any) => s + (i.dueAmount || 0), 0);

    // Budget utilization
    const budget = project.budget || 0;
    const budgetUtilization = budget > 0 ? (totalExpenses / budget) * 100 : 0;

    // Cost per sq.ft
    const costPerSqFt = project.area && project.area > 0 ? totalExpenses / project.area : null;

    // Monthly burn rate (last 3 months)
    const now = new Date();
    const burnRate: any[] = [];
    for (let i = 2; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = monthStart.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const monthLabour = attendanceRecords.filter((r: any) => new Date(r.date) >= monthStart && new Date(r.date) <= monthEnd).reduce((s: number, r: any) => s + (r.wageAmount || 0), 0);
      const monthFuel = fuelLogs.filter((r: any) => new Date(r.date) >= monthStart && new Date(r.date) <= monthEnd).reduce((s: number, r: any) => s + (r.totalCost || 0), 0);
      burnRate.push({ month: monthLabel, labour: monthLabour, fuel: monthFuel });
    }

    res.json({
      success: true,
      data: {
        budget,
        budgetUtilization: Math.round(budgetUtilization * 10) / 10,
        costPerSqFt: costPerSqFt ? Math.round(costPerSqFt) : null,
        area: project.area,
        totalExpenses,
        categories: {
          labour: labourCost,
          equipmentRental: equipmentRentalCost,
          equipmentFuel: equipmentFuelCost,
          equipmentMaintenance: equipmentMaintenanceCost,
          material: materialCost,
          contracts: contractCost,
        },
        vendorBreakdown,
        income: { invoiced: totalInvoiced, collected: totalCollected, due: totalDue },
        netProfit: totalCollected - totalExpenses,
        burnRate,
        equipmentDeployments: deployments.map((d: any) => ({
          equipmentName: d.equipment?.name,
          equipmentType: d.equipment?.type,
          startDate: d.startDate,
          endDate: d.endDate,
          dailyRate: d.dailyRate,
          status: d.status,
          totalCost: d.totalCost
        })),
      }
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
