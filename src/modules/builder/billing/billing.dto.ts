import { z } from 'zod';

// Invoice Schemas
export const createInvoiceSchema = z.object({
  bookingId: z.string().uuid(),
  description: z.string().optional(),
  totalAmount: z.number().positive(),
  taxAmount: z.number().nonnegative().optional(),
  dueDate: z.string().datetime(),
});

export const updateInvoiceSchema = z.object({
  description: z.string().optional(),
  status: z.enum(['UNPAID', 'PARTIAL', 'PAID']).optional(),
  dueDate: z.string().datetime().optional(),
});

// Payment Schemas
export const recordPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.string().min(1),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDTO = z.infer<typeof updateInvoiceSchema>;
export type RecordPaymentDTO = z.infer<typeof recordPaymentSchema>;
