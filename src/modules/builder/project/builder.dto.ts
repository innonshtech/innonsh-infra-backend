import { z } from 'zod';

export const createUnitSchema = z.object({
  projectId: z.string().uuid(),
  unitNumber: z.string().min(1),
  floorNumber: z.number().int().optional(),
  bhk: z.string().optional(),
  type: z.string().optional(),
  area: z.number().positive().optional(),
  facing: z.string().optional(),
  price: z.number().nonnegative(),
});

export const updateUnitSchema = z.object({
  unitNumber: z.string().optional(),
  status: z.enum(['AVAILABLE', 'BOOKED', 'SOLD', 'BLOCKED']).optional(),
  price: z.number().optional(),
  notes: z.string().optional(),
});

export const createLeadSchema = z.object({
  projectId: z.string().uuid().optional(),
  name: z.string().min(2),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  source: z.string().optional(),
  notes: z.string().optional(),
});

export const updateLeadSchema = z.object({
  status: z.enum(['NEW', 'CONTACTED', 'VISIT', 'NEGOTIATION', 'WON', 'LOST']).optional(),
  notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  projectId: z.string().uuid(),
  unitId: z.string().uuid(),
  customerId: z.string().uuid(),
  totalAmount: z.number().positive(),
  paidAmount: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export type CreateUnitDTO = z.infer<typeof createUnitSchema>;
export type UpdateUnitDTO = z.infer<typeof updateUnitSchema>;
export type CreateLeadDTO = z.infer<typeof createLeadSchema>;
export type CreateBookingDTO = z.infer<typeof createBookingSchema>;
