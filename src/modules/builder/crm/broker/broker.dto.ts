import { z } from 'zod';

// Broker Schemas
export const createBrokerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  agencyName: z.string().optional(),
  commissionRate: z.number().min(0).max(100).default(0),
});

export const updateBrokerSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).optional(),
  agencyName: z.string().optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

// Broker Client Schema (Simplified for the sub-resource GET)
export type BrokerDTO = z.infer<typeof createBrokerSchema>;
export type UpdateBrokerDTO = z.infer<typeof updateBrokerSchema>;
