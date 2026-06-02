import { z } from 'zod';

// Unit Schemas
export const createUnitSchema = z.object({
  projectId: z.string().uuid(),
  unitNumber: z.string().min(1),
  floor: z.number().int().optional(),
  type: z.string().min(1),
  area: z.number().positive(),
  price: z.number().nonnegative(),
});

export const updateUnitSchema = z.object({
  unitNumber: z.string().min(1).optional(),
  floor: z.number().int().optional(),
  type: z.string().min(1).optional(),
  area: z.number().positive().optional(),
  price: z.number().nonnegative().optional(),
});

export const updateUnitStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'BOOKED', 'SOLD', 'BLOCKED']),
  notes: z.string().optional(),
});

export const updateUnitPriceSchema = z.object({
  price: z.number().nonnegative(),
});

export type CreateUnitDTO = z.infer<typeof createUnitSchema>;
export type UpdateUnitDTO = z.infer<typeof updateUnitSchema>;
export type UpdateUnitStatusDTO = z.infer<typeof updateUnitStatusSchema>;
export type UpdateUnitPriceDTO = z.infer<typeof updateUnitPriceSchema>;
