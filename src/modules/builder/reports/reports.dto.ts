import { z } from 'zod';

export const reportQuerySchema = z.object({
  projectId: z.string().uuid().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export type ReportQueryDTO = z.infer<typeof reportQuerySchema>;
