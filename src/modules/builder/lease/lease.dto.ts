import { z } from 'zod';

// Tenant Schemas
export const createTenantSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'CORPORATE']).default('INDIVIDUAL'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  type: z.enum(['INDIVIDUAL', 'CORPORATE']).optional(),
});

// Agreement Schemas
export const createAgreementSchema = z.object({
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  rentAmount: z.number().positive(),
  securityDeposit: z.number().nonnegative().optional(),
});

export const updateAgreementSchema = z.object({
  endDate: z.string().datetime().optional(),
  rentAmount: z.number().positive().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'TERMINATED']).optional(),
});

// Rent Collection Schemas
export const collectRentSchema = z.object({
  agreementId: z.string().uuid(),
  amount: z.number().positive(),
  month: z.number().min(1).max(12),
  year: z.number().min(2000).max(2100),
  paymentMethod: z.string().min(1),
});

export type CreateTenantDTO = z.infer<typeof createTenantSchema>;
export type UpdateTenantDTO = z.infer<typeof updateTenantSchema>;
export type CreateAgreementDTO = z.infer<typeof createAgreementSchema>;
export type UpdateAgreementDTO = z.infer<typeof updateAgreementSchema>;
export type CollectRentDTO = z.infer<typeof collectRentSchema>;
