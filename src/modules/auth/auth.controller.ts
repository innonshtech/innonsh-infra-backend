import { Request, Response, NextFunction } from 'express';
import { sendResponse } from '../../utils/response.util';
import { authService } from './auth.service';
import { 
  registerDTOSchema, 
  registerSuperadminDTOSchema,
  loginDTOSchema, 
  refreshTokenDTOSchema, 
  forgotPasswordDTOSchema, 
  resetPasswordDTOSchema 
} from './auth.dto';

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerDTOSchema.parse(req.body);
    const result = await authService.register(data);
    sendResponse(res, 201, 'User registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const registerSuperadmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSuperadminDTOSchema.parse(req.body);
    const result = await authService.registerSuperadmin(data);
    sendResponse(res, 201, 'Superadmin registered successfully', result);
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginDTOSchema.parse(req.body);
    const result = await authService.login(data);
    sendResponse(res, 200, 'Login successful', result);
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    await authService.logout(userId);
    sendResponse(res, 200, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = refreshTokenDTOSchema.parse(req.body);
    const result = await authService.refresh(data);
    sendResponse(res, 200, 'Token refreshed successfully', result);
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = forgotPasswordDTOSchema.parse(req.body);
    const result = await authService.forgotPassword(data);
    sendResponse(res, 200, 'If an account exists, a reset link has been sent.', result);
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = resetPasswordDTOSchema.parse(req.body);
    await authService.resetPassword(data);
    sendResponse(res, 200, 'Password has been reset successfully. Please login with your new password.');
  } catch (error) {
    next(error);
  }
};
