import express from 'express';
import { UsersController } from './users.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new UsersController();

/**
 * @swagger
 * tags:
 *   name: System Users
 *   description: User management for the system
 */

/**
 * @swagger
 * /api/v1/system/users:
 *   get:
 *     summary: Get all users in the company
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authMiddleware, allowPermissions('users.view'), controller.getAllUsers);

/**
 * @swagger
 * /api/v1/system/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', authMiddleware, allowPermissions('users.view'), controller.getUserById);

/**
 * @swagger
 * /api/v1/system/users:
 *   post:
 *     summary: Create a new user
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, firstName, lastName]
 *             properties:
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 8 }
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               roleId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', authMiddleware, allowPermissions('users.create'), controller.createUser);

/**
 * @swagger
 * /api/v1/system/users/{id}:
 *   patch:
 *     summary: Update user details
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 */
router.patch('/:id', authMiddleware, allowPermissions('users.update'), controller.updateUser);

/**
 * @swagger
 * /api/v1/system/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/:id', authMiddleware, allowPermissions('users.delete'), controller.deleteUser);

/**
 * @swagger
 * /api/v1/system/users/{id}/role:
 *   patch:
 *     summary: Assign role to user
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roleId]
 *             properties:
 *               roleId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Role assigned
 */
router.patch('/:id/role', authMiddleware, allowPermissions('users.update'), controller.assignRole);

/**
 * @swagger
 * /api/v1/system/users/{id}/status:
 *   patch:
 *     summary: Toggle user status
 *     tags: [System Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', authMiddleware, allowPermissions('users.update'), controller.toggleStatus);

export default router;
