import { z } from 'zod';

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required: [email, password, firstName, lastName, companyName, erpType]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string, minLength: 6 }
 *         firstName: { type: string }
 *         lastName: { type: string }
 *         companyName: { type: string }
 *         erpType: { type: string, enum: [CONTRACTOR, BUILDER] }
 *     LoginInput:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email: { type: string, format: email }
 *         password: { type: string }
 *     RefreshTokenInput:
 *       type: object
 *       required: [refreshToken]
 *       properties:
 *         refreshToken: { type: string }
 *     ForgotPasswordInput:
 *       type: object
 *       required: [email]
 *       properties:
 *         email: { type: string, format: email }
 *     ResetPasswordInput:
 *       type: object
 *       required: [token, newPassword]
 *       properties:
 *         token: { type: string }
 *         newPassword: { type: string, minLength: 6 }
 */

export const registerDTOSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  companyName: z.string().min(2),
  erpType: z.enum(['CONTRACTOR', 'BUILDER'])
});

export const registerSuperadminDTOSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(2),
  lastName: z.string().min(2)
});

export const loginDTOSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const refreshTokenDTOSchema = z.object({
  refreshToken: z.string()
});

export const forgotPasswordDTOSchema = z.object({
  email: z.string().email()
});

export const resetPasswordDTOSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6)
});

export type RegisterInput = z.infer<typeof registerDTOSchema>;
export type RegisterSuperadminInput = z.infer<typeof registerSuperadminDTOSchema>;
export type LoginInput = z.infer<typeof loginDTOSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenDTOSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordDTOSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordDTOSchema>;
