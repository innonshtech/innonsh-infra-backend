import { z } from 'zod';

export const createEstimationSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
});

export const addEstimationItemSchema = z.object({
  inventoryItemId: z.string().uuid().optional(),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  rate: z.number().nonnegative(),
});

export const updateEstimationItemSchema = z.object({
  inventoryItemId: z.string().uuid().optional().nullable(),
  description: z.string().min(1).optional(),
  quantity: z.number().positive().optional(),
  unit: z.string().min(1).optional(),
  rate: z.number().nonnegative().optional(),
});

export type CreateEstimationDTO = z.infer<typeof createEstimationSchema>;
export type AddEstimationItemDTO = z.infer<typeof addEstimationItemSchema>;
export type UpdateEstimationItemDTO = z.infer<typeof updateEstimationItemSchema>;
