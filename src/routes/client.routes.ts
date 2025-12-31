import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole } from '@prisma/client';

export const clientRouter = Router();

clientRouter.use(authenticate);

const clientSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  document: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
});

// List clients
clientRouter.get('/', async (req, res, next) => {
  try {
    const { search, isActive, page = '1', limit = '20' } = req.query;

    const where: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { document: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        include: {
          _count: {
            select: { projects: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limitNum,
      }),
      prisma.client.count({ where }),
    ]);

    res.json({
      data: clients,
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

// Get client by ID
clientRouter.get('/:id', async (req, res, next) => {
  try {
    const client = await prisma.client.findUnique({
      where: { id: req.params.id },
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            progress: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!client) {
      throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
    }

    res.json(client);
  } catch (error) {
    next(error);
  }
});

// Create client
clientRouter.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const data = clientSchema.parse(req.body);

      // Check for duplicate document
      if (data.document) {
        const existing = await prisma.client.findUnique({
          where: { document: data.document },
        });

        if (existing) {
          throw new AppError('Client with this document already exists', 409, 'DUPLICATE_DOCUMENT');
        }
      }

      const client = await prisma.client.create({
        data: {
          ...data,
          email: data.email || null,
        },
      });

      res.status(201).json(client);
    } catch (error) {
      next(error);
    }
  }
);

// Update client
clientRouter.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const data = clientSchema.partial().parse(req.body);

      const client = await prisma.client.update({
        where: { id: req.params.id },
        data: {
          ...data,
          email: data.email || null,
        },
      });

      res.json(client);
    } catch (error) {
      next(error);
    }
  }
);

// Delete client
clientRouter.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  async (req, res, next) => {
    try {
      // Check if client has projects
      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
        include: { _count: { select: { projects: true } } },
      });

      if (!client) {
        throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
      }

      if (client._count.projects > 0) {
        throw new AppError(
          'Cannot delete client with projects. Deactivate instead.',
          400,
          'CLIENT_HAS_PROJECTS'
        );
      }

      await prisma.client.delete({ where: { id: req.params.id } });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Toggle client active status
clientRouter.patch(
  '/:id/toggle-active',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const client = await prisma.client.findUnique({
        where: { id: req.params.id },
      });

      if (!client) {
        throw new AppError('Client not found', 404, 'CLIENT_NOT_FOUND');
      }

      const updated = await prisma.client.update({
        where: { id: req.params.id },
        data: { isActive: !client.isActive },
      });

      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);
