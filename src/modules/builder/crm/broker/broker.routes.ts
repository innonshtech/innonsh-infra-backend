import express from 'express';
import { BrokerController } from './broker.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new BrokerController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder CRM - Brokers
 *   description: Real estate broker and agency management
 */

/**
 * @swagger
 * /api/v1/builder/crm/brokers:
 *   get:
 *     summary: Get all brokers
 *     tags: [Builder CRM - Brokers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of brokers
 */
router.get('/', authMiddleware, builderGuard, allowPermissions('crm.brokers.view'), controller.getAllBrokers);

/**
 * @swagger
 * /api/v1/builder/crm/brokers/{id}:
 *   get:
 *     summary: Get broker by ID
 *     tags: [Builder CRM - Brokers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Broker details
 */
router.get('/:id', authMiddleware, builderGuard, allowPermissions('crm.brokers.view'), controller.getBrokerById);

/**
 * @swagger
 * /api/v1/builder/crm/brokers:
 *   post:
 *     summary: Create a new broker
 *     tags: [Builder CRM - Brokers]
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
 *               agencyName: { type: string }
 *               commissionRate: { type: number, default: 0 }
 *     responses:
 *       201:
 *         description: Broker created
 */
router.post('/', authMiddleware, builderGuard, allowPermissions('crm.brokers.create'), controller.createBroker);

/**
 * @swagger
 * /api/v1/builder/crm/brokers/{id}:
 *   patch:
 *     summary: Update broker details
 *     tags: [Builder CRM - Brokers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Broker updated
 */
router.patch('/:id', authMiddleware, builderGuard, allowPermissions('crm.brokers.update'), controller.updateBroker);

/**
 * @swagger
 * /api/v1/builder/crm/brokers/{id}:
 *   delete:
 *     summary: Delete a broker
 *     tags: [Builder CRM - Brokers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Broker deleted
 */
router.delete('/:id', authMiddleware, builderGuard, allowPermissions('crm.brokers.delete'), controller.deleteBroker);

/**
 * @swagger
 * /api/v1/builder/crm/brokers/{id}/clients:
 *   get:
 *     summary: Get all clients/leads associated with this broker
 *     tags: [Builder CRM - Brokers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of clients
 */
router.get('/:id/clients', authMiddleware, builderGuard, allowPermissions('crm.brokers.view'), controller.getBrokerClients);

export default router;
