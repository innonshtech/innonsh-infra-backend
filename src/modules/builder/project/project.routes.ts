import express from 'express';
import { BuilderProjectController } from './project.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new BuilderProjectController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Projects
 *   description: Real estate project and inventory management
 */

/**
 * @swagger
 * /api/v1/builder/projects:
 *   get:
 *     summary: Get all builder projects
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getAllProjects);

/**
 * @swagger
 * /api/v1/builder/projects/leads:
 *   get:
 */
router.get('/leads', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getLeads);

/**
 * @swagger
 * /api/v1/builder/projects/leads:
 *   post:
 */
router.post('/leads', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.createLead);

/**
 * @swagger
 * /api/v1/builder/projects/bookings:
 *   post:
 */
router.post('/bookings', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.createBooking);

/**
 * @swagger
 * /api/v1/builder/projects/{id}:
 *   get:
 *     summary: Get builder project by ID
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/:id', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getProjectById);

/**
 * @swagger
 * /api/v1/builder/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Builder Projects]
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
 *               description: { type: string }
 *               status: { type: string, enum: [PLANNED, ONGOING, COMPLETED, ON_HOLD] }
 *               budget: { type: number }
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/', authMiddleware, builderGuard, allowPermissions('projects.create'), controller.createProject);

/**
 * @swagger
 * /api/v1/builder/projects/{id}:
 *   patch:
 *     summary: Update project details
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project updated
 */
router.patch('/:id', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.updateProject);

/**
 * @swagger
 * /api/v1/builder/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.delete('/:id', authMiddleware, builderGuard, allowPermissions('projects.delete'), controller.deleteProject);

/**
 * @swagger
 * /api/v1/builder/projects/{id}/dashboard:
 *   get:
 *     summary: Get project health and inventory dashboard
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/:id/dashboard', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getDashboard);

/**
 * @swagger
 * /api/v1/builder/projects/{id}/units:
 *   get:
 *     summary: Get all units in this project
 *     tags: [Builder Projects]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: List of units
 */
router.get('/:id/units', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getUnits);

/**
 * @swagger
 * /api/v1/builder/projects/{id}/units:
 *   post:
 *     summary: Add a new unit to the project
 *     tags: [Builder Projects]
 */
router.post('/:id/units', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.createUnit);

router.get('/:id/bookings', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getBookings);

// --- Isolated Construction / WBS Routes ---
router.get('/:id/tasks', authMiddleware, builderGuard, allowPermissions('projects.view'), controller.getTasks);
router.post('/:id/tasks', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.createTask);
router.patch('/tasks/:taskId', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.updateTask);
router.delete('/tasks/:taskId', authMiddleware, builderGuard, allowPermissions('projects.update'), controller.deleteTask);

export default router;
