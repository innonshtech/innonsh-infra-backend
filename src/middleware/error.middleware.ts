import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.util';
import { sendResponse } from '../utils/response.util';

export class AppError extends Error {
  public statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'ZodError') {
    statusCode = 400;
    const errors = err.errors || err.issues || [];
    message = errors.map((e: any) => `${e.path?.join('.') || 'Field'}: ${e.message}`).join(', ') || 'Validation error';
  }

  logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  sendResponse(res, statusCode, message, err.statusCode ? null : err.stack);
};
