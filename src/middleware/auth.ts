import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from './errorHandler.js';
import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('No token provided', 401, 'NO_TOKEN');
    }

    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    req.user = decoded;
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401, 'NOT_AUTHENTICATED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError('Not authorized', 403, 'NOT_AUTHORIZED'));
    }

    next();
  };
};

export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
        req.user = decoded;
      }
    }

    next();
  } catch {
    // Token invalid, continue without user
    next();
  }
};
