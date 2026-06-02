import express from 'express';
import { BookingController } from './booking.controller';
import { authMiddleware } from '@middleware/auth.middleware';
import { checkERPType } from '@middleware/erp.middleware';
import { allowPermissions } from '@middleware/rbac.middleware';

const router = express.Router();
const controller = new BookingController();

const builderGuard = checkERPType(['BUILDER']);

/**
 * @swagger
 * tags:
 *   name: Builder Bookings
 *   description: Management of unit sales and bookings
 */

/**
 * @swagger
 * /api/v1/builder/bookings:
 *   get:
 *     summary: Get all bookings
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of bookings
 */
router.get('/', authMiddleware, builderGuard, allowPermissions('bookings.view'), controller.getAllBookings);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}:
 *   get:
 *     summary: Get booking by ID
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking details with unit and payment plan
 */
router.get('/:id', authMiddleware, builderGuard, allowPermissions('bookings.view'), controller.getBookingById);

/**
 * @swagger
 * /api/v1/builder/bookings:
 *   post:
 *     summary: Create a new unit booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [projectId, unitId, clientName, totalAmount, bookingAmount]
 *             properties:
 *               projectId: { type: string, format: uuid }
 *               unitId: { type: string, format: uuid }
 *               clientName: { type: string }
 *               clientEmail: { type: string }
 *               clientPhone: { type: string }
 *               totalAmount: { type: number }
 *               bookingAmount: { type: number }
 *               bookingDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Booking created and unit status updated to BOOKED
 */
router.post('/', authMiddleware, builderGuard, allowPermissions('bookings.create'), controller.createBooking);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}:
 *   patch:
 *     summary: Update booking primary details
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.patch('/:id', authMiddleware, builderGuard, allowPermissions('bookings.update'), controller.updateBooking);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}:
 *   delete:
 *     summary: Delete a booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Booking deleted and unit status reset to AVAILABLE
 */
router.delete('/:id', authMiddleware, builderGuard, allowPermissions('bookings.delete'), controller.deleteBooking);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}/cancel:
 *   post:
 *     summary: Cancel a booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Booking cancelled and unit released
 */
router.post('/:id/cancel', authMiddleware, builderGuard, allowPermissions('bookings.update'), controller.cancelBooking);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}/confirm:
 *   post:
 *     summary: Confirm a booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Booking confirmed and unit marked as SOLD
 */
router.post('/:id/confirm', authMiddleware, builderGuard, allowPermissions('bookings.update'), controller.confirmBooking);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}/payment-plan:
 *   get:
 *     summary: Get payment plan for a booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of payment milestones
 */
router.get('/:id/payment-plan', authMiddleware, builderGuard, allowPermissions('bookings.view'), controller.getPaymentPlan);

/**
 * @swagger
 * /api/v1/builder/bookings/{id}/payment-plan:
 *   post:
 *     summary: Define or update payment plan for a booking
 *     tags: [Builder Bookings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required: [milestoneName, percentage, amount]
 *               properties:
 *                 milestoneName: { type: string }
 *                 percentage: { type: number, description: "Percentage of total amount (0-100)" }
 *                 amount: { type: number }
 *                 dueDate: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Payment plan saved
 */
router.post('/:id/payment-plan', authMiddleware, builderGuard, allowPermissions('bookings.update'), controller.savePaymentPlan);

export default router;
