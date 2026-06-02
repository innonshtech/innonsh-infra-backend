import express from 'express';
import { FinanceController } from './finance.controller';
import { authMiddleware } from '../../../middleware/auth.middleware';
import { checkERPType } from '../../../middleware/erp.middleware';
import { allowPermissions } from '../../../middleware/rbac.middleware';

const router = express.Router();
const controller = new FinanceController();

const contractorGuard = checkERPType(['CONTRACTOR', 'BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Finance
 *   description: Financial transactions, invoices and payments management
 */

// --- Transactions ---

/**
 * @swagger
 * /api/v1/contractor/finance/transactions:
 *   get:
 *     summary: Get all financial transactions
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of transactions
 */
router.get('/transactions', authMiddleware, contractorGuard, allowPermissions(['finance.view', 'finance.manage']), controller.getAllTransactions);

/**
 * @swagger
 * /api/v1/contractor/finance/transactions:
 *   post:
 *     summary: Record a new financial transaction
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount]
 *             properties:
 *               type: { type: string, enum: [INCOME, EXPENSE] }
 *               category: { type: string }
 *               amount: { type: number }
 *               description: { type: string }
 *               date: { type: string, format: date-time }
 *               reference: { type: string }
 *     responses:
 *       201:
 *         description: Transaction recorded
 */
router.post('/transactions', authMiddleware, contractorGuard, allowPermissions('finance.manage'), controller.createTransaction);


// --- Invoices ---

/**
 * @swagger
 * /api/v1/contractor/finance/invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/invoices', authMiddleware, contractorGuard, allowPermissions(['finance.view', 'finance.manage']), controller.getAllInvoices);

/**
 * @swagger
 * /api/v1/contractor/finance/invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, dueDate, items]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               clientName: { type: string }
 *               dueDate: { type: string, format: date-time }
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [description, quantity, unitPrice]
 *                   properties:
 *                     description: { type: string }
 *                     quantity: { type: number }
 *                     unitPrice: { type: number }
 *     responses:
 *       201:
 *         description: Invoice created
 */
router.post('/invoices', authMiddleware, contractorGuard, allowPermissions('finance.manage'), controller.createInvoice);

/**
 * @swagger
 * /api/v1/contractor/finance/invoices/{id}:
 *   patch:
 *     summary: Update an invoice
 *     tags: [Finance]
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
router.patch('/invoices/:id', authMiddleware, contractorGuard, allowPermissions('finance.manage'), controller.updateInvoice);

/**
 * @swagger
 * /api/v1/contractor/finance/invoices/{id}:
 *   delete:
 *     summary: Delete an invoice
 *     tags: [Finance]
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
router.delete('/invoices/:id', authMiddleware, contractorGuard, allowPermissions('finance.manage'), controller.deleteInvoice);


// --- Payments ---

/**
 * @swagger
 * /api/v1/contractor/finance/payments:
 *   get:
 *     summary: Get all payments
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of payments
 */
router.get('/payments', authMiddleware, contractorGuard, allowPermissions(['finance.view', 'finance.manage']), controller.getAllPayments);

/**
 * @swagger
 * /api/v1/contractor/finance/payments:
 *   post:
 *     summary: Record a payment (Links to transaction and invoice)
 *     tags: [Finance]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, paymentMethod]
 *             properties:
 *               invoiceId: { type: string, format: uuid }
 *               amount: { type: number }
 *               paymentDate: { type: string, format: date-time }
 *               paymentMethod: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Payment recorded and transaction generated
 */
router.post('/payments', authMiddleware, contractorGuard, allowPermissions('finance.manage'), controller.recordPayment);

// --- Reports / Analytics ---
router.get('/reports/summary', authMiddleware, contractorGuard, allowPermissions(['finance.view', 'finance.manage']), async (req: any, res, next) => {
  try {
    const companyId = req.user!.company_id;
    const { prisma } = require('../../../config/prisma.config');

    // Fetch all core data in parallel
    const [invoices, transactions, payments, projects] = await Promise.all([
      (prisma as any).invoice.findMany({ where: { companyId } }),
      (prisma as any).transaction.findMany({ where: { companyId } }),
      (prisma as any).payment.findMany({ where: { companyId } }),
      (prisma as any).project.findMany({
        where: { companyId },
        select: { id: true, name: true, budget: true, status: true },
      }),
    ]);

    // Revenue & Expense Totals
    const totalIncome = transactions.filter((t: any) => t.type === 'INCOME').reduce((s: number, t: any) => s + t.amount, 0);
    const totalExpenses = transactions.filter((t: any) => t.type === 'EXPENSE').reduce((s: number, t: any) => s + t.amount, 0);

    // Expense Breakdown by Category
    const expenseByCategory: Record<string, number> = {};
    transactions.filter((t: any) => t.type === 'EXPENSE').forEach((t: any) => {
      const cat = t.category || 'UNCATEGORIZED';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t.amount;
    });

    // Outstanding Invoices
    const overdueInvoices = invoices.filter((inv: any) => inv.status !== 'PAID' && new Date(inv.dueDate) < new Date());
    const totalReceivables = invoices.reduce((s: number, inv: any) => s + (inv.dueAmount || 0), 0);
    const totalInvoiced = invoices.reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
    const totalCollected = invoices.reduce((s: number, inv: any) => s + (inv.paidAmount || 0), 0);

    // Project P&L (basic: budget vs expenses linked via invoice project or transaction)
    const projectPL = projects.map((p: any) => {
      const projInvoices = invoices.filter((inv: any) => inv.projectId === p.id);
      const invoicedAmount = projInvoices.reduce((s: number, inv: any) => s + (inv.totalAmount || 0), 0);
      const collectedAmount = projInvoices.reduce((s: number, inv: any) => s + (inv.paidAmount || 0), 0);
      const dueAmount = projInvoices.reduce((s: number, inv: any) => s + (inv.dueAmount || 0), 0);
      return {
        id: p.id,
        name: p.name,
        budget: p.budget || 0,
        status: p.status,
        invoiced: invoicedAmount,
        collected: collectedAmount,
        due: dueAmount,
      };
    });

    // Cash Flow (monthly aggregation of last 6 months)
    const now = new Date();
    const cashFlow = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthLabel = month.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      const inflow = transactions
        .filter((t: any) => t.type === 'INCOME' && new Date(t.date) >= month && new Date(t.date) <= monthEnd)
        .reduce((s: number, t: any) => s + t.amount, 0);
      const outflow = transactions
        .filter((t: any) => t.type === 'EXPENSE' && new Date(t.date) >= month && new Date(t.date) <= monthEnd)
        .reduce((s: number, t: any) => s + t.amount, 0);
      cashFlow.push({ month: monthLabel, inflow, outflow });
    }

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses,
        totalInvoiced,
        totalCollected,
        totalReceivables,
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((s: number, inv: any) => s + (inv.dueAmount || 0), 0),
        expenseByCategory,
        projectPL,
        cashFlow,
      },
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;
