import express from 'express';
import { LegalController } from './legal.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new LegalController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Legal
 *   description: Legal documentation, project approvals and compliance management
 */

// --- Documents ---

/**
 * @swagger
 * /api/v1/builder/legal/documents:
 *   get:
 *     summary: Get all legal documents
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of documents
 */
router.get('/documents', authMiddleware, builderGuard, allowPermissions('legal.documents.view'), controller.getAllDocuments);

/**
 * @swagger
 * /api/v1/builder/legal/documents/{id}:
 *   get:
 *     summary: Get legal document by ID
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document details
 */
router.get('/documents/:id', authMiddleware, builderGuard, allowPermissions('legal.documents.view'), controller.getDocumentById);

/**
 * @swagger
 * /api/v1/builder/legal/documents:
 *   post:
 *     summary: Upload/Record a new legal document
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title, fileUrl]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               title: { type: string }
 *               description: { type: string }
 *               fileUrl: { type: string }
 *               expiryDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Document recorded
 */
router.post('/documents', authMiddleware, builderGuard, allowPermissions('legal.documents.create'), controller.createDocument);

/**
 * @swagger
 * /api/v1/builder/legal/documents/{id}:
 *   patch:
 *     summary: Update legal document
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document updated
 */
router.patch('/documents/:id', authMiddleware, builderGuard, allowPermissions('legal.documents.update'), controller.updateDocument);

/**
 * @swagger
 * /api/v1/builder/legal/documents/{id}:
 *   delete:
 *     summary: Delete a legal document
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Document deleted
 */
router.delete('/documents/:id', authMiddleware, builderGuard, allowPermissions('legal.documents.delete'), controller.deleteDocument);


// --- Approvals ---

/**
 * @swagger
 * /api/v1/builder/legal/approvals:
 *   get:
 *     summary: Get all project approvals/sanctions
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of approvals
 */
router.get('/approvals', authMiddleware, builderGuard, allowPermissions('legal.approvals.view'), controller.getAllApprovals);

/**
 * @swagger
 * /api/v1/builder/legal/approvals:
 *   post:
 *     summary: Record a project approval
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, authorityName, approvalType]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               authorityName: { type: string }
 *               approvalType: { type: string }
 *               status: { type: string, enum: [PENDING, APPROVED, REJECTED] }
 *               approvalDate: { type: string, format: date-time }
 *               validUntil: { type: string, format: date-time }
 *               referenceNumber: { type: string }
 *     responses:
 *       201:
 *         description: Approval recorded
 */
router.post('/approvals', authMiddleware, builderGuard, allowPermissions('legal.approvals.manage'), controller.recordApproval);


// --- Compliance ---

/**
 * @swagger
 * /api/v1/builder/legal/compliance:
 *   get:
 *     summary: Get all compliance records
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of compliance audits
 */
router.get('/compliance', authMiddleware, builderGuard, allowPermissions('legal.compliance.view'), controller.getAllCompliance);

/**
 * @swagger
 * /api/v1/builder/legal/compliance:
 *   post:
 *     summary: Record a compliance audit
 *     tags: [Builder Legal]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, title, category]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               title: { type: string }
 *               category: { type: string }
 *               status: { type: string, enum: [COMPLIANT, NON_COMPLIANT, UNDER_REVIEW] }
 *               lastAuditDate: { type: string, format: date-time }
 *               nextAuditDate: { type: string, format: date-time }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Compliance record saved
 */
router.post('/compliance', authMiddleware, builderGuard, allowPermissions('legal.compliance.manage'), controller.recordCompliance);

export default router;
