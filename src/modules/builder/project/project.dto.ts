import { z } from 'zod';

// Project Schemas (Builder Specific)
export const createBuilderProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'ON_HOLD']).default('PLANNED'),
  budget: z.number().nonnegative().optional(),
  location: z.string().optional(),
  totalUnits: z.number().int().positive().optional(),
});

export const updateBuilderProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'ONGOING', 'COMPLETED', 'ON_HOLD']).optional(),
  budget: z.number().nonnegative().optional(),
  location: z.string().optional(),
});

export type CreateBuilderProjectDTO = z.infer<typeof createBuilderProjectSchema>;
export type UpdateBuilderProjectDTO = z.infer<typeof updateBuilderProjectSchema>;
