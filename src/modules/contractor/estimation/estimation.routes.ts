import express from 'express';
import { EstimationController } from './estimation.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';
import { allowPermissions } from '../../../middleware/rbac.middleware';

const router = express.Router();
const controller = new EstimationController();

const contractorGuard = checkERPType(['CONTRACTOR']);

/**
 * @swagger
 * tags:
 *   name: Contractor Estimations
 *   description: Estimation and version management for contractors
 */

/**
 * @swagger
 * /api/v1/contractor/estimations:
 *   get:
 *     summary: Get all estimations
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of estimations
 */
router.get('/', authMiddleware, contractorGuard, allowPermissions('estimations.view'), controller.getAllEstimations);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}:
 *   get:
 *     summary: Get estimation by ID
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estimation details with versions
 */
router.get('/:id', authMiddleware, contractorGuard, allowPermissions('estimations.view'), controller.getEstimationById);

/**
 * @swagger
 * /api/v1/contractor/estimations:
 *   post:
 *     summary: Create a new estimation
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Estimation created (Version 1)
 */
router.post('/', authMiddleware, contractorGuard, allowPermissions('estimations.create'), controller.createEstimation);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}:
 *   delete:
 *     summary: Delete an estimation
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estimation deleted
 */
router.delete('/:id', authMiddleware, contractorGuard, allowPermissions('estimations.delete'), controller.deleteEstimation);
router.patch('/:id', authMiddleware, contractorGuard, allowPermissions('estimations.create'), controller.updateEstimation);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/items:
 *   post:
 *     summary: Add item to the current version
 *     tags: [Contractor Estimations]
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
 *             required: [description, quantity, unit, rate]
 *             properties:
 *               description: { type: string }
 *               quantity: { type: number }
 *               unit: { type: string }
 *               rate: { type: number }
 *     responses:
 *       201:
 *         description: Item added
 */
router.post('/:id/items', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.addItem);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/items/{itemId}:
 *   patch:
 *     summary: Update an item in the current version
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item updated
 */
router.patch('/:id/items/:itemId', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.updateItem);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/items/{itemId}:
 *   delete:
 *     summary: Remove an item from the current version
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item removed
 */
router.delete('/:id/items/:itemId', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.deleteItem);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/approve:
 *   post:
 *     summary: Approve the current version
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Estimation approved
 */
router.post('/:id/approve', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.approveEstimation);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/request-approval:
 *   post:
 *     summary: Request approval for the current version
 *     tags: [Contractor Estimations]
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
 *             required: [designatedApproverId]
 *             properties:
 *               designatedApproverId:
 *                 type: string
 *                 format: uuid
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Approval requested
 */
router.post('/:id/request-approval', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.requestApproval);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/versions:
 *   get:
 *     summary: Get all versions of an estimation
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of versions
 */
router.get('/:id/versions', authMiddleware, contractorGuard, allowPermissions('estimations.view'), controller.getVersions);

/**
 * @swagger
 * /api/v1/contractor/estimations/{id}/new-version:
 *   post:
 *     summary: Create a new version from the current one
 *     tags: [Contractor Estimations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: New version created
 */
router.post('/:id/new-version', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.createNewVersion);

router.post('/:id/push-to-procurement', authMiddleware, contractorGuard, allowPermissions('estimations.update'), controller.pushToProcurement);

router.get('/:id/check-inventory', authMiddleware, contractorGuard, allowPermissions('estimations.view'), controller.checkInventory);

export default router;
