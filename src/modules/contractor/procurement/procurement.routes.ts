import express from 'express';
import { ProcurementController } from './procurement.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';
import { allowPermissions } from '../../../middleware/rbac.middleware';

const router = express.Router();
const controller = new ProcurementController();

const contractorGuard = checkERPType(['CONTRACTOR', 'BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Procurement
 *   description: Procurement requests and purchase order management
 */

// --- Procurement Requests ---

/**
 * @swagger
 * /api/v1/contractor/procurement/requests:
 *   get:
 *     summary: Get all procurement requests
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of procurement requests
 */
router.get('/requests', authMiddleware, contractorGuard, allowPermissions('procurement.view'), controller.getAllRequests);

/**
 * @swagger
 * /api/v1/contractor/procurement/requests/{id}:
 *   get:
 *     summary: Get procurement request by ID
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request details
 */
router.get('/requests/:id', authMiddleware, contractorGuard, allowPermissions('procurement.view'), controller.getRequestById);

/**
 * @swagger
 * /api/v1/contractor/procurement/requests:
 *   post:
 *     summary: Create a new procurement request
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title, items]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               title: { type: string }
 *               description: { type: string }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, quantity, unit]
 *                   properties:
 *                     description: { type: string }
 *                     quantity: { type: number }
 *                     unit: { type: string }
 *                     estimatedRate: { type: number }
 *     responses:
 *       201:
 *         description: Request created
 */
router.post('/requests', authMiddleware, contractorGuard, allowPermissions('procurement.create'), controller.createRequest);

/**
 * @swagger
 * /api/v1/contractor/procurement/requests/{id}:
 *   patch:
 *     summary: Update a procurement request
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Request updated
 */
router.patch('/requests/:id', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.updateRequest);

/**
 * @swagger
 * /api/v1/contractor/procurement/requests/{id}:
 *   delete:
 *     summary: Delete a procurement request
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request deleted
 */
router.delete('/requests/:id', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.deleteRequest);

/**
 * @swagger
 * /api/v1/contractor/procurement/requests/{id}/approve:
 *   post:
 *     summary: Approve a procurement request
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Request approved
 */
router.post('/requests/:id/approve', authMiddleware, contractorGuard, allowPermissions('procurement.approve'), controller.approveRequest);
router.post('/requests/:id/reject', authMiddleware, contractorGuard, allowPermissions('procurement.approve'), controller.rejectRequest);


// --- Purchase Orders ---

/**
 * @swagger
 * /api/v1/contractor/procurement/purchase-orders:
 *   get:
 *     summary: Get all purchase orders
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of purchase orders
 */
router.get('/purchase-orders', authMiddleware, contractorGuard, allowPermissions(['procurement.view', 'procurement.approve']), controller.getAllPurchaseOrders);

/**
 * @swagger
 * /api/v1/contractor/procurement/purchase-orders:
 *   post:
 *     summary: Create a new purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vendorId, items]
 *             properties:
 *               vendorId: { type: string, format: uuid }
 *               requestId: { type: string, format: uuid }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, quantity, unit, rate]
 *                   properties:
 *                     description: { type: string }
 *                     quantity: { type: number }
 *                     unit: { type: string }
 *                     rate: { type: number }
 *     responses:
 *       201:
 *         description: Purchase order created
 */
router.post('/purchase-orders', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.createPurchaseOrder);

/**
 * @swagger
 * /api/v1/contractor/procurement/purchase-orders/{id}:
 *   patch:
 *     summary: Update a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId: { type: string, format: uuid }
 *               status: { type: string, enum: [DRAFT, SENT, RECEIVED, PAID, CANCELLED] }
 *     responses:
 *       200:
 *         description: Purchase order updated
 */
router.patch('/purchase-orders/:id', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.updatePurchaseOrder);

/**
 * @swagger
 * /api/v1/contractor/procurement/purchase-orders/{id}:
 *   delete:
 *     summary: Delete a purchase order
 *     tags: [Procurement]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Purchase order deleted
 */
router.delete('/purchase-orders/:id', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.deletePurchaseOrder);

router.post('/purchase-orders/:id/receive', authMiddleware, contractorGuard, allowPermissions(['procurement.create', 'procurement.approve']), controller.receivePurchaseOrder);

// --- Vendors ---
router.get('/vendors', authMiddleware, contractorGuard, allowPermissions('procurement.view'), controller.getAllVendors);
router.post('/vendors', authMiddleware, contractorGuard, allowPermissions('procurement.create'), controller.createVendor);
router.delete('/vendors/:id', authMiddleware, contractorGuard, allowPermissions('procurement.create'), controller.deleteVendor);

export default router;
