import express from 'express';
import { ReportsController } from './reports.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new ReportsController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Reports
 *   description: Executive dashboard and financial analytics
 */

/**
 * @swagger
 * /api/v1/builder/dashboard:
 *   get:
 *     summary: Get high-level builder dashboard statistics
 *     tags: [Builder Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Consolidated stats for projects, inventory, sales and financials
 */
router.get('/dashboard', authMiddleware, builderGuard, allowPermissions('dashboard.view'), controller.getDashboard);

/**
 * @swagger
 * /api/v1/builder/reports/sales:
 *   get:
 *     summary: Get detailed sales performance report
 *     tags: [Builder Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: startDate
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: endDate
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: List of sales transactions with project details
 */
router.get('/reports/sales', authMiddleware, builderGuard, allowPermissions('reports.view'), controller.getSalesReport);

/**
 * @swagger
 * /api/v1/builder/reports/revenue:
 *   get:
 *     summary: Get actual revenue collection report
 *     tags: [Builder Reports]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of received payments and income logs
 */
router.get('/reports/revenue', authMiddleware, builderGuard, allowPermissions('reports.view'), controller.getRevenueReport);

/**
 * @swagger
 * /api/v1/builder/reports/bookings:
 *   get:
 *     summary: Get booking pipeline report
 *     tags: [Builder Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of pending and confirmed bookings
 */
router.get('/reports/bookings', authMiddleware, builderGuard, allowPermissions('reports.view'), controller.getBookingsReport);

/**
 * @swagger
 * /api/v1/builder/reports/dues:
 *   get:
 *     summary: Get aging dues and outstanding payments report
 *     tags: [Builder Reports]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Prioritized list of unpaid invoices and balances
 */
router.get('/reports/dues', authMiddleware, builderGuard, allowPermissions('reports.view'), controller.getDuesReport);

export default router;
