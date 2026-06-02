import express from 'express';
import { UnitsController } from './units.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new UnitsController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Units
 *   description: Management of individual real estate units
 */

/**
 * @swagger
 * /api/v1/builder/units:
 *   get:
 *     summary: Get all units
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of units
 */
router.get('/', authMiddleware, builderGuard, allowPermissions('units.view'), controller.getAllUnits);

/**
 * @swagger
 * /api/v1/builder/units/{id}:
 *   get:
 *     summary: Get unit by ID
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unit details
 */
router.get('/:id', authMiddleware, builderGuard, allowPermissions('units.view'), controller.getUnitById);

/**
 * @swagger
 * /api/v1/builder/units:
 *   post:
 *     summary: Create a new unit
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, unitNumber, type, area, price]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               unitNumber: { type: string }
 *               floor: { type: number }
 *               type: { type: string }
 *               area: { type: number }
 *               price: { type: number }
 *     responses:
 *       201:
 *         description: Unit created
 */
router.post('/', authMiddleware, builderGuard, allowPermissions('units.create'), controller.createUnit);

/**
 * @swagger
 * /api/v1/builder/units/{id}:
 *   patch:
 *     summary: Update unit details
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unit updated
 */
router.patch('/:id', authMiddleware, builderGuard, allowPermissions('units.update'), controller.updateUnit);

/**
 * @swagger
 * /api/v1/builder/units/{id}:
 *   delete:
 *     summary: Delete a unit
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Unit deleted
 */
router.delete('/:id', authMiddleware, builderGuard, allowPermissions('units.delete'), controller.deleteUnit);

/**
 * @swagger
 * /api/v1/builder/units/{id}/status:
 *   patch:
 *     summary: Update unit status (Available/Booked/Sold)
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
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
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [AVAILABLE, BOOKED, SOLD, BLOCKED] }
 *               notes: { type: string }
 *     responses:
 *       200:
 *         description: Status updated and history log created
 */
router.patch('/:id/status', authMiddleware, builderGuard, allowPermissions('units.update'), controller.updateStatus);

/**
 * @swagger
 * /api/v1/builder/units/{id}/history:
 *   get:
 *     summary: Get status transition history for this unit
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Status history logs
 */
router.get('/:id/history', authMiddleware, builderGuard, allowPermissions('units.view'), controller.getHistory);

/**
 * @swagger
 * /api/v1/builder/units/{id}/pricing:
 *   get:
 *     summary: Get pricing history logs for this unit
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Price change logs
 */
router.get('/:id/pricing', authMiddleware, builderGuard, allowPermissions('units.view'), controller.getPricing);

/**
 * @swagger
 * /api/v1/builder/units/{id}/pricing:
 *   patch:
 *     summary: Update unit pricing
 *     tags: [Builder Units]
 *     security: [{ bearerAuth: [] }]
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
 *             required: [price]
 *             properties:
 *               price: { type: number }
 *     responses:
 *       200:
 *         description: Price updated and log created
 */
router.patch('/:id/pricing', authMiddleware, builderGuard, allowPermissions('units.update'), controller.updatePricing);

export default router;
