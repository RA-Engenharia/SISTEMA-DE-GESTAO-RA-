import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    logger.log(level, `${method} ${originalUrl} ${statusCode} - ${duration}ms`);
  });

  next();
};
