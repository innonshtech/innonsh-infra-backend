import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const allowPermissions = (requiredPermissions: string | string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('User not authenticated', 401);
      }

      // Permissions are embedded in the JWT payload
      const userPermissions: string[] = user.permissions || [];

      if (userPermissions.includes('*')) {
        return next();
      }

      const permsToCheck = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      const hasPermission = permsToCheck.some(p => userPermissions.includes(p));

      if (hasPermission) {
        return next();
      }

      console.error(`[RBAC] User ${user.email} (ID: ${user.id}) denied access. Has: [${userPermissions.join(', ')}]. Needs one of: [${permsToCheck.join(', ')}]`);
      throw new AppError('Forbidden: You do not have the required permissions.', 403);
    } catch (error) {
      next(error);
    }
  };
};

export const authorizeRole = (requiredRole: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new AppError('User not authenticated', 401);
      }

      if (req.user.role === requiredRole || req.user.role === 'SUPERADMIN') {
        return next();
      }

      throw new AppError(`Forbidden: Requires ${requiredRole} role.`, 403);
    } catch (error) {
      next(error);
    }
  };
};
