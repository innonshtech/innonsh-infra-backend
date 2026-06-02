import { z } from 'zod';

// Booking Schemas
export const createBookingSchema = z.object({
  projectId: z.string().uuid(),
  unitId: z.string().uuid(),
  clientName: z.string().min(2),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(10).optional(),
  totalAmount: z.number().positive(),
  bookingAmount: z.number().positive(),
  bookingDate: z.string().datetime().optional(),
});

export const updateBookingSchema = z.object({
  clientName: z.string().min(2).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(10).optional(),
  totalAmount: z.number().positive().optional(),
});

// Payment Plan Schemas
export const createPaymentPlanSchema = z.array(z.object({
  milestoneName: z.string().min(1),
  percentage: z.number().min(0).max(100),
  amount: z.number().positive(),
  dueDate: z.string().datetime().optional(),
}));

export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
export type UpdateBookingDTO = z.infer<typeof updateBookingSchema>;
export type CreatePaymentPlanDTO = z.infer<typeof createPaymentPlanSchema>;
