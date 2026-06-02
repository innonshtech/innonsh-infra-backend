import { z } from 'zod';

// Procurement Request Schemas
export const createProcurementRequestSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(3),
  description: z.string().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    estimatedRate: z.number().nonnegative().optional(),
  })).min(1),
});

export const updateProcurementRequestSchema = z.object({
  title: z.string().min(3).optional(),
  description: z.string().optional(),
});

// Purchase Order Schemas
export const createPurchaseOrderSchema = z.object({
  vendorId: z.string().uuid(),
  requestId: z.string().uuid().optional(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unit: z.string().min(1),
    rate: z.number().nonnegative(),
  })).min(1),
});

export const updatePurchaseOrderSchema = z.object({
  vendorId: z.string().uuid().optional(),
  status: z.enum(['DRAFT', 'SENT', 'RECEIVED', 'PAID', 'CANCELLED']).optional(),
});

export type CreateProcurementRequestDTO = z.infer<typeof createProcurementRequestSchema>;
export type UpdateProcurementRequestDTO = z.infer<typeof updateProcurementRequestSchema>;
export type CreatePurchaseOrderDTO = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderDTO = z.infer<typeof updatePurchaseOrderSchema>;
