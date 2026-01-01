import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import { authenticate, JwtPayload } from '../middleware/auth.js';

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().optional(),
  department: z.string().optional(),
});

const generateTokens = (payload: JwtPayload) => {
  const accessToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  const refreshToken = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.REFRESH_TOKEN_EXPIRES_IN,
  });

  return { accessToken, refreshToken };
};

// Login
authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Register
authRouter.post('/register', async (req, res, next) => {
  try {
    const data = registerSchema.parse(req.body);

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
        avatar: true,
      },
    });

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    res.status(201).json({
      user,
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
});

// Refresh token
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token required', 400, 'NO_REFRESH_TOKEN');
    }

    const decoded = jwt.verify(refreshToken, env.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError('User not found or inactive', 401, 'USER_INACTIVE');
    }

    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const tokens = generateTokens(payload);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// Get current user
authRouter.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        phone: true,
        department: true,
        createdAt: true,
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

// Change password
authRouter.post('/change-password', authenticate, async (req, res, next) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new AppError('Current password is incorrect', 400, 'INVALID_PASSWORD');
    }

    const hashedPassword = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
});
