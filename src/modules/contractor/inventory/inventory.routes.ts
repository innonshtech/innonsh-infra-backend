import express from 'express';
import { InventoryController } from './inventory.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';
import { allowPermissions } from '../../../middleware/rbac.middleware';

const router = express.Router();
const controller = new InventoryController();

const contractorGuard = checkERPType(['CONTRACTOR', 'BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Warehouse, items and stock management
 */

// --- Items ---

/**
 * @swagger
 * /api/v1/contractor/inventory/items:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of items
 */
router.get('/items', authMiddleware, contractorGuard, allowPermissions(['inventory.view', 'inventory.manage']), controller.getAllItems);

/**
 * @swagger
 * /api/v1/contractor/inventory/items:
 *   post:
 *     summary: Create new inventory item
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, unit]
 *             properties:
 *               name: { type: string }
 *               sku: { type: string }
 *               description: { type: string }
 *               unit: { type: string }
 *     responses:
 *       201:
 *         description: Item created
 */
router.post('/items', authMiddleware, contractorGuard, allowPermissions('inventory.manage'), controller.createItem);

/**
 * @swagger
 * /api/v1/contractor/inventory/items/{id}:
 *   patch:
 *     summary: Update inventory item
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item updated
 */
router.patch('/items/:id', authMiddleware, contractorGuard, allowPermissions('inventory.manage'), controller.updateItem);

/**
 * @swagger
 * /api/v1/contractor/inventory/items/{id}:
 *   delete:
 *     summary: Delete inventory item
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Item deleted
 */
router.delete('/items/:id', authMiddleware, contractorGuard, allowPermissions('inventory.manage'), controller.deleteItem);


// --- Stock & Movement ---

/**
 * @swagger
 * /api/v1/contractor/inventory/stock:
 *   get:
 *     summary: Get current stock levels across all warehouses
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Stock levels
 */
router.get('/stock', authMiddleware, contractorGuard, allowPermissions(['inventory.view', 'inventory.manage']), controller.getStock);
router.get('/stock/movements', authMiddleware, contractorGuard, allowPermissions(['inventory.view', 'inventory.manage']), controller.getMovements);

/**
 * @swagger
 * /api/v1/contractor/inventory/stock/movement:
 *   post:
 *     summary: Record a stock movement (IN, OUT, TRANSFER)
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [inventoryItemId, warehouseId, quantity, type]
 *             properties:
 *               inventoryItemId: { type: string, format: uuid }
 *               warehouseId: { type: string, format: uuid }
 *               quantity: { type: number, description: "Positive for addition, negative for deduction" }
 *               type: { type: string, enum: [IN, OUT, TRANSFER] }
 *               reference: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Movement recorded and stock updated
 */
router.post('/stock/movement', authMiddleware, contractorGuard, allowPermissions('inventory.manage'), controller.processMovement);


// --- Warehouses ---

/**
 * @swagger
 * /api/v1/contractor/inventory/warehouses:
 *   get:
 *     summary: Get all warehouses
 *     tags: [Inventory]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of warehouses
 */
router.get('/warehouses', authMiddleware, contractorGuard, allowPermissions(['inventory.view', 'inventory.manage']), controller.getAllWarehouses);

/**
 * @swagger
 * /api/v1/contractor/inventory/warehouses:
 *   post:
 *     summary: Create new warehouse
 *     tags: [Inventory]
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
 *               location: { type: string }
 *     responses:
 *       201:
 *         description: Warehouse created
 */
router.post('/warehouses', authMiddleware, contractorGuard, allowPermissions('inventory.manage'), controller.createWarehouse);

export default router;
