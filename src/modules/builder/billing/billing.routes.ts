import express from 'express';
import { BillingController } from './billing.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new BillingController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Billing
 *   description: Invoicing, payments and demand letter management
 */

// --- Invoices ---

/**
 * @swagger
 * /api/v1/builder/billing/invoices:
 *   get:
 *     summary: Get all billing invoices
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/invoices', authMiddleware, builderGuard, allowPermissions('billing.invoices.view'), controller.getAllInvoices);

/**
 * @swagger
 * /api/v1/builder/billing/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice details and associated payments
 */
router.get('/invoices/:id', authMiddleware, builderGuard, allowPermissions('billing.invoices.view'), controller.getInvoiceById);

/**
 * @swagger
 * /api/v1/builder/billing/invoices:
 *   post:
 *     summary: Create a new billing invoice (Demand Letter)
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, totalAmount, dueDate]
 *             properties:
 *               bookingId: { type: string, format: uuid }
 *               description: { type: string }
 *               totalAmount: { type: number }
 *               taxAmount: { type: number }
 *               dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/invoices', authMiddleware, builderGuard, allowPermissions('billing.invoices.create'), controller.createInvoice);

/**
 * @swagger
 * /api/v1/builder/billing/invoices/{id}:
 *   patch:
 *     summary: Update an invoice
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice updated
 */
router.patch('/invoices/:id', authMiddleware, builderGuard, allowPermissions('billing.invoices.update'), controller.updateInvoice);

/**
 * @swagger
 * /api/v1/builder/billing/invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Invoice deleted
 */
router.delete('/invoices/:id', authMiddleware, builderGuard, allowPermissions('billing.invoices.delete'), controller.deleteInvoice);


// --- Payments ---

/**
 * @swagger
 * /api/v1/builder/billing/payments:
 *   get:
 *     summary: Get all billing payments
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/payments', authMiddleware, builderGuard, allowPermissions('billing.payments.view'), controller.getAllPayments);

/**
 * @swagger
 * /api/v1/builder/billing/payments:
 *   post:
 *     summary: Record a new billing payment
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookingId, amount, paymentMethod]
 *             properties:
 *               bookingId: { type: string, format: uuid }
 *               invoiceId: { type: string, format: uuid }
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date-time }
 *               paymentMethod: { type: string }
 *               reference: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded and linked invoice status updated
 */
router.post('/payments', authMiddleware, builderGuard, allowPermissions('billing.payments.create'), controller.recordPayment);


// --- Reports & Dues ---

/**
 * @swagger
 * /api/v1/builder/billing/dues:
 *   get:
 *     summary: Get list of pending billing dues
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of unpaid/partial invoices
 */
router.get('/dues', authMiddleware, builderGuard, allowPermissions('billing.view'), controller.getDues);

/**
 * @swagger
 * /api/v1/builder/billing/reports:
 *   get:
 *     summary: Get financial collection summary
 *     tags: [Builder Billing]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Financial performance metrics
 */
router.get('/reports', authMiddleware, builderGuard, allowPermissions('billing.view'), controller.getReports);

export default router;
