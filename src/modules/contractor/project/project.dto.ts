import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(3),
  description: z.string().optional(),
  status: z.string().default('PLANNED'),
  budget: z.number().positive().optional(),
  code: z.string().optional(),
  projectType: z.string().optional(),
  priority: z.string().optional(),
  clientName: z.string().optional(),
  clientContactPerson: z.string().optional(),
  clientPhone: z.string().optional(),
  clientEmail: z.string().optional(),
  contractNumber: z.string().optional(),
  workOrderNumber: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  pincode: z.string().optional(),
  googleMapsUrl: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  budget: z.number().positive().optional(),
  code: z.string().nullable().optional(),
  projectType: z.string().nullable().optional(),
  priority: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  clientContactPerson: z.string().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  clientEmail: z.string().nullable().optional(),
  contractNumber: z.string().nullable().optional(),
  workOrderNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  pincode: z.string().nullable().optional(),
  googleMapsUrl: z.string().nullable().optional(),
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

// Project Planning Validation Schemas
export const updatePlanningSchema = z.object({
  plannedStartDate: z.string().datetime({ offset: true }).nullable().optional().or(z.string().nullable().optional()),
  plannedEndDate: z.string().datetime({ offset: true }).nullable().optional().or(z.string().nullable().optional()),
  currentPhase: z.string().nullable().optional(),
  delayDays: z.number().int().nullable().optional(),
  planningNotes: z.string().nullable().optional(),
});

export const createPhaseSchema = z.object({
  name: z.string().min(1),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  isStarted: z.boolean().optional(),
  isCompleted: z.boolean().optional(),
  progress: z.number().min(0).max(100).optional(),
  status: z.string().optional(),
});

export const createMilestoneSchema = z.object({
  name: z.string().min(1),
  targetDate: z.string(),
  isCompleted: z.boolean().optional(),
});

export const createResourcePlanSchema = z.object({
  category: z.enum(['LABOUR', 'EQUIPMENT', 'MATERIAL']),
  name: z.string().min(1),
  quantity: z.number().nonnegative(),
  unit: z.string().nullable().optional(),
  phaseId: z.string().uuid().nullable().optional().or(z.string().nullable().optional()),
});


export const createRiskSchema = z.object({
  name: z.string().min(1),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
});

export type UpdatePlanningDTO = z.infer<typeof updatePlanningSchema>;
export type CreatePhaseDTO = z.infer<typeof createPhaseSchema>;
export type CreateMilestoneDTO = z.infer<typeof createMilestoneSchema>;
export type CreateResourcePlanDTO = z.infer<typeof createResourcePlanSchema>;
export type CreateRiskDTO = z.infer<typeof createRiskSchema>;

