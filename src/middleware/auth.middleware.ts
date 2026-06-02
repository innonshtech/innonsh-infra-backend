import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt.util';
import { AppError } from './error.middleware';
import { prisma } from '../config/prisma.config';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No token provided. Authorization denied.', 401);
    }

    const token = authHeader.split(' ')[1]!;
    const decoded = verifyToken(token) as any;
    
    if (!decoded || !decoded.id) {
      throw new AppError('Invalid token payload', 401);
    }

    // Fetch fresh user data from DB to prevent stale JWT permissions
    const freshUser = await (prisma as any).user.findUnique({
      where: { id: decoded.id },
      include: { role: true, company: true }
    });

    if (!freshUser) throw new AppError('User no longer exists', 401);
    if (!freshUser.isActive) throw new AppError('Account is inactive', 401);

    const userPermissions = new Set([...(freshUser.permissions || []), ...(freshUser.role?.permissions || [])]);
    
    // ── Auto-grant: .manage implies all granular sub-permissions ──
    // This ensures that a user with "projects.manage" can access routes
    // guarded by "projects.view", "projects.create", etc.
    const manageToGranular: Record<string, string[]> = {
      'projects.manage': ['projects.view', 'projects.create', 'projects.update', 'projects.delete',
                          'tasks.manage',
                          'inventory.view', 'inventory.manage',
                          'estimations.view', 'estimations.create', 'estimations.update', 'estimations.delete'],
      'finance.manage':  ['finance.view'],
      'inventory.manage': ['inventory.view'],
      'procurement.manage': ['procurement.view', 'procurement.create', 'procurement.approve'],
      'estimations.manage': ['estimations.view', 'estimations.create', 'estimations.update', 'estimations.delete'],
    };

    for (const [manage, granulars] of Object.entries(manageToGranular)) {
      if (userPermissions.has(manage)) {
        granulars.forEach(p => userPermissions.add(p));
      }
    }

    // Wildcard: if user has '*', they bypass all permission checks anyway (handled in rbac middleware)

    req.user = {
      id: freshUser.id,
      email: freshUser.email,
      erpType: freshUser.company?.erpType || 'PLATFORM_OWNER',
      role: freshUser.role?.name || 'USER',
      company_id: freshUser.companyId || '',
      permissions: Array.from(userPermissions)
    };

    // Multi-tenant requirement: every request must carry a company_id (UNLESS it is the Global Platform Superadmin)
    if (req.user.role !== 'SUPERADMIN' && req.user.erpType !== 'PLATFORM_OWNER' && !req.user.company_id) {
      throw new AppError('Invalid token. Company ID missing.', 401);
    }

    next();
  } catch (error: any) {
    console.error(`[AuthMiddleware Error] ${error.message}`, error);
    next(new AppError(error.message || 'Invalid or expired token', error.statusCode || 401));
  }
};
