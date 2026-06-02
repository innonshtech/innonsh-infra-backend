import { Request, Response, NextFunction } from 'express';
import { AppError } from './error.middleware';

export const checkERPType = (allowedTypes: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user || !user.erpType) {
        throw new AppError('User missing ERP type association', 403);
      }

      if (allowedTypes.includes(user.erpType)) {
        return next();
      }

      throw new AppError('Forbidden: Your company does not have access to this ERP module.', 403);
    } catch (error) {
      next(error);
    }
  };
};
