import express from 'express';
import {
  getCompanies,
  approveCompany,
  rejectCompany,
  updateStatus,
} from './company.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { authorizeRole } from '../../middleware/rbac.middleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Superadmin
 *   description: Superadmin company management
 */

/**
 * @swagger
 * /api/v1/superadmin/companies:
 *   get:
 *     summary: Get all registered companies
 *     tags: [Superadmin]
 *     responses:
 *       200:
 *         description: List of companies
 */
router.get('/companies', authMiddleware, authorizeRole('SUPERADMIN'), getCompanies);

/**
 * @swagger
 * /api/v1/superadmin/companies/{id}/approve:
 *   patch:
 *     summary: Approve a company
 *     tags: [Superadmin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company approved successfully
 */
router.patch('/companies/:id/approve', authMiddleware, authorizeRole('SUPERADMIN'), approveCompany);

/**
 * @swagger
 * /api/v1/superadmin/companies/{id}/reject:
 *   patch:
 *     summary: Reject a company
 *     tags: [Superadmin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Company rejected successfully
 */
router.patch('/companies/:id/reject', authMiddleware, authorizeRole('SUPERADMIN'), rejectCompany);

/**
 * @swagger
 * /api/v1/superadmin/companies/{id}/status:
 *   patch:
 *     summary: Update company status
 *     tags: [Superadmin]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Company ID
 *       - in: body
 *         name: status
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               enum: [PENDING, ACTIVE, REJECTED, SUSPENDED, TRIAL]
 *     responses:
 *       200:
 *         description: Company status updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Company not found
 */
router.patch('/companies/:id/status', authMiddleware, authorizeRole('SUPERADMIN'), updateStatus);

export default router;