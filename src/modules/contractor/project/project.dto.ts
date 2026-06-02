import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).default('PLANNED'),
  budget: z.number().positive().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.enum(['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  budget: z.number().positive().optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid(),
  role: z.string().default('MEMBER'),
});

export const updateProgressSchema = z.object({
  percentage: z.number().min(0).max(100),
  statusUpdate: z.string().optional(),
});

export type CreateProjectDTO = z.infer<typeof createProjectSchema>;
export type UpdateProjectDTO = z.infer<typeof updateProjectSchema>;
export type AddMemberDTO = z.infer<typeof addMemberSchema>;
export type UpdateProgressDTO = z.infer<typeof updateProgressSchema>;
