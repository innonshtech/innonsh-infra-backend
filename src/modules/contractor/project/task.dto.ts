import { z } from 'zod';

export const createTaskSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  wbsCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  weightage: z.number().min(0).default(0),
  parentId: z.string().uuid().optional().nullable(),
  isMilestone: z.boolean().default(false),
  milestoneTriggerValue: z.number().min(0).max(100).optional().default(100),
  imageUrl: z.string().url().optional().or(z.string().length(0)),
});

export const updateTaskSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  wbsCode: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  weightage: z.number().min(0).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD']).optional(),
  isMilestone: z.boolean().optional(),
  milestoneTriggerValue: z.number().min(0).max(100).optional(),
  imageUrl: z.string().url().optional().or(z.string().length(0)),
});

export type CreateTaskDTO = z.infer<typeof createTaskSchema>;
export type UpdateTaskDTO = z.infer<typeof updateTaskSchema>;
