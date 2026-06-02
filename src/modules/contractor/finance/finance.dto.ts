import { z } from 'zod';

// Invoice Schemas
export const createInvoiceSchema = z.object({
  projectId: z.string().uuid(),
  clientName: z.string().optional(),
  dueDate: z.string().datetime(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })).min(1),
});

export const updateInvoiceSchema = z.object({
  clientName: z.string().optional(),
  status: z.enum(['UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
  dueDate: z.string().datetime().optional(),
});

// Transaction Schemas
export const createTransactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().optional(),
  amount: z.number().positive(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
  reference: z.string().optional(),
});

// Payment Schemas
export const createPaymentSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  amount: z.number().positive(),
  paymentDate: z.string().datetime().optional(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDTO = z.infer<typeof updateInvoiceSchema>;
export type CreateTransactionDTO = z.infer<typeof createTransactionSchema>;
export type CreatePaymentDTO = z.infer<typeof createPaymentSchema>;
