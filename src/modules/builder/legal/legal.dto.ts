import { z } from 'zod';

// Legal Document Schemas
export const createLegalDocumentSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(2),
  description: z.string().optional(),
  fileUrl: z.string().url(),
  expiryDate: z.string().datetime().optional(),
});

export const updateLegalDocumentSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  fileUrl: z.string().url().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'ARCHIVED']).optional(),
});

// Legal Approval Schemas
export const createLegalApprovalSchema = z.object({
  projectId: z.string().uuid(),
  authorityName: z.string().min(2),
  approvalType: z.string().min(2),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
  approvalDate: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  referenceNumber: z.string().optional(),
});

// Compliance Record Schemas
export const createComplianceRecordSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(2),
  category: z.string().min(2),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW']).default('COMPLIANT'),
  lastAuditDate: z.string().datetime().optional(),
  nextAuditDate: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export type CreateLegalDocumentDTO = z.infer<typeof createLegalDocumentSchema>;
export type UpdateLegalDocumentDTO = z.infer<typeof updateLegalDocumentSchema>;
export type CreateLegalApprovalDTO = z.infer<typeof createLegalApprovalSchema>;
export type CreateComplianceRecordDTO = z.infer<typeof createComplianceRecordSchema>;
