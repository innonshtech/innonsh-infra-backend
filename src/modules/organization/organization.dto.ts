import { z } from 'zod';

export const updateCompanyProfileSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  logo: z.string().optional().nullable(),
  code: z.string().optional().nullable(),
  gstNumber: z.string().optional().nullable(),
  panNumber: z.string().optional().nullable(),
  regNumber: z.string().optional().nullable(),
  ownerName: z.string().optional().nullable(),
  email: z.string().email('Invalid email').optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  pincode: z.string().optional().nullable(),
});

export const createBranchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  code: z.string().min(1, 'Branch code is required'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().email('Invalid email'),
  managerName: z.string().optional().nullable(),
});

export const updateBranchSchema = createBranchSchema.partial();

export const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
});

export const createDesignationSchema = z.object({
  name: z.string().min(1, 'Designation name is required'),
});

export const createDocumentSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  type: z.string().min(1, 'Document type is required'),
  url: z.string().min(1, 'Document file/URL is required'),
  expiryDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

export const updateSettingsSchema = z.object({
  currency: z.string().optional(),
  timeZone: z.string().optional(),
  financialYear: z.string().optional(),
  dateFormat: z.string().optional(),
  numberFormat: z.string().optional(),
});
