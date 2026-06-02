import express from 'express';
import { LeaseController } from './lease.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new LeaseController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Lease
 *   description: Tenant management, lease agreements and rent collection
 */

// --- Tenants ---

/**
 * @swagger
 * /api/v1/builder/lease/tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of tenants
 */
router.get('/tenants', authMiddleware, builderGuard, allowPermissions('lease.tenants.view'), controller.getAllTenants);

/**
 * @swagger
 * /api/v1/builder/lease/tenants/{id}:
 *   get:
 *     summary: Get tenant by ID
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant details
 */
router.get('/tenants/:id', authMiddleware, builderGuard, allowPermissions('lease.tenants.view'), controller.getTenantById);

/**
 * @swagger
 * /api/v1/builder/lease/tenants:
 *   post:
 *     summary: Create a new tenant
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               type: { type: string, enum: [INDIVIDUAL, CORPORATE] }
 *     responses:
 *       201:
 *         description: Tenant created
 */
router.post('/tenants', authMiddleware, builderGuard, allowPermissions('lease.tenants.create'), controller.createTenant);

/**
 * @swagger
 * /api/v1/builder/lease/tenants/{id}:
 *   patch:
 *     summary: Update tenant details
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant updated
 */
router.patch('/tenants/:id', authMiddleware, builderGuard, allowPermissions('lease.tenants.update'), controller.updateTenant);

/**
 * @swagger
 * /api/v1/builder/lease/tenants/{id}:
 *   delete:
 *     summary: Delete a tenant
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Tenant deleted
 */
router.delete('/tenants/:id', authMiddleware, builderGuard, allowPermissions('lease.tenants.delete'), controller.deleteTenant);


// --- Agreements ---

/**
 * @swagger
 * /api/v1/builder/lease/agreements:
 *   get:
 *     summary: Get all lease agreements
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of agreements
 */
router.get('/agreements', authMiddleware, builderGuard, allowPermissions('lease.agreements.view'), controller.getAllAgreements);

/**
 * @swagger
 * /api/v1/builder/lease/agreements:
 *   post:
 *     summary: Create a new lease agreement
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantId, unitId, startDate, endDate, rentAmount]
 *             properties:
 *               tenantId: { type: string, format: uuid }
 *               unitId: { type: string, format: uuid }
 *               startDate: { type: string, format: date-time }
 *               endDate: { type: string, format: date-time }
 *               rentAmount: { type: number }
 *               securityDeposit: { type: number }
 *     responses:
 *       201:
 *         description: Agreement created and unit status updated
 */
router.post('/agreements', authMiddleware, builderGuard, allowPermissions('lease.agreements.create'), controller.createAgreement);

/**
 * @swagger
 * /api/v1/builder/lease/agreements/{id}:
 *   patch:
 *     summary: Update lease agreement
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Agreement updated
 */
router.patch('/agreements/:id', authMiddleware, builderGuard, allowPermissions('lease.agreements.update'), controller.updateAgreement);


// --- Rent Collection ---

/**
 * @swagger
 * /api/v1/builder/lease/rent-collection:
 *   get:
 *     summary: Get all rent collection records
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of collections
 */
router.get('/rent-collection', authMiddleware, builderGuard, allowPermissions('lease.rent.view'), controller.getRentCollections);

/**
 * @swagger
 * /api/v1/builder/lease/rent-collection:
 *   post:
 *     summary: Record a rent payment
 *     tags: [Builder Lease]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [agreementId, amount, month, year, paymentMethod]
 *             properties:
 *               agreementId: { type: string, format: uuid }
 *               amount: { type: number }
 *               month: { type: number }
 *               year: { type: number }
 *               paymentMethod: { type: string }
 *     responses:
 *       201:
 *         description: Rent collection recorded
 */
router.post('/rent-collection', authMiddleware, builderGuard, allowPermissions('lease.rent.manage'), controller.collectRent);

export default router;
