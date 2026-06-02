import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  roleId: z.string().uuid().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type UpdateUserDTO = z.infer<typeof updateUserSchema>;
export type AssignRoleDTO = z.infer<typeof assignRoleSchema>;
export type ToggleStatusDTO = z.infer<typeof toggleStatusSchema>;
