import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export const userRouter = Router();

// All routes require authentication
userRouter.use(authenticate);

const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  avatar: z.string().url().optional(),
});

const adminUserUpdateSchema = userUpdateSchema.extend({
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
});

const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.nativeEnum(UserRole).default(UserRole.VIEWER),
  phone: z.string().optional(),
  department: z.string().optional(),
});

// List users (admin/manager only)
userRouter.get('/', authorize(UserRole.ADMIN, UserRole.MANAGER), async (req, res, next) => {
  try {
    const { search, role, isActive, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role && typeof role === 'string') {
      where.role = role as UserRole;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          department: true,
          avatar: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
userRouter.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Non-admins can only view their own profile
    if (req.user!.role !== UserRole.ADMIN && req.user!.userId !== id) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        avatar: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
userRouter.post('/', authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const data = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 409, 'EMAIL_EXISTS');
    }

    const hashedPassword = await bcrypt.hash(data.password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    next(error);
  }
});

// Update user
userRouter.patch('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user!.role === UserRole.ADMIN;
    const isOwnProfile = req.user!.userId === id;

    if (!isAdmin && !isOwnProfile) {
      throw new AppError('Not authorized', 403, 'NOT_AUTHORIZED');
    }

    const schema = isAdmin ? adminUserUpdateSchema : userUpdateSchema;
    const data = schema.parse(req.body);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        department: true,
        avatar: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
userRouter.delete('/:id', authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user!.userId === id) {
      throw new AppError('Cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    await prisma.user.delete({ where: { id } });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Reset password (admin only)
userRouter.post('/:id/reset-password', authorize(UserRole.ADMIN), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { password } = z.object({ password: z.string().min(8) }).parse(req.body);

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
});
