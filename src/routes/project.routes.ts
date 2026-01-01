import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { UserRole, ProjectStatus } from '@prisma/client';

export const projectRouter = Router();

projectRouter.use(authenticate);

const projectSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  code: z.string().min(2),
  status: z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  estimatedCost: z.number().positive().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
});

// List projects
projectRouter.get('/', async (req, res, next) => {
  try {
    const {
      search,
      status,
      clientId,
      managerId,
      page = '1',
      limit = '20',
    } = req.query;

    const where: Record<string, unknown> = {};

    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && typeof status === 'string') {
      where.status = status as ProjectStatus;
    }

    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }

    if (managerId && typeof managerId === 'string') {
      where.managerId = managerId;
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          client: {
            select: { id: true, name: true },
          },
          manager: {
            select: { id: true, name: true, avatar: true },
          },
          _count: {
            select: { tasks: true, documents: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.project.count({ where }),
    ]);

    res.json({
      data: projects,
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

// Get project by ID
projectRouter.get('/:id', async (req, res, next) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        client: true,
        manager: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        tasks: {
          where: { parentId: null },
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
            subtasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, avatar: true },
                },
              },
            },
          },
          orderBy: { order: 'asc' },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: { tasks: true, documents: true },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Create project
projectRouter.post(
  '/',
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  async (req, res, next) => {
    try {
      const data = projectSchema.parse(req.body);

      // Check for duplicate code
      const existing = await prisma.project.findUnique({
        where: { code: data.code },
      });

      if (existing) {
        throw new AppError('Project code already exists', 409, 'DUPLICATE_CODE');
      }

      const project = await prisma.project.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
        },
        include: {
          client: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'PROJECT',
          entityId: project.id,
          userId: req.user!.userId,
          projectId: project.id,
          details: { name: project.name, code: project.code },
        },
      });

      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }
);

// Update project
projectRouter.patch(
  '/:id',
  authorize(UserRole.ADMIN, UserRole.MANAGER, UserRole.ENGINEER),
  async (req, res, next) => {
    try {
      const data = projectSchema.partial().parse(req.body);

      // Check for duplicate code if updating
      if (data.code) {
        const existing = await prisma.project.findFirst({
          where: {
            code: data.code,
            NOT: { id: req.params.id },
          },
        });

        if (existing) {
          throw new AppError('Project code already exists', 409, 'DUPLICATE_CODE');
        }
      }

      const project = await prisma.project.update({
        where: { id: req.params.id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
        include: {
          client: { select: { id: true, name: true } },
          manager: { select: { id: true, name: true } },
        },
      });

      // Log activity
      await prisma.activityLog.create({
        data: {
          action: 'UPDATE',
          entity: 'PROJECT',
          entityId: project.id,
          userId: req.user!.userId,
          projectId: project.id,
          details: data,
        },
      });

      res.json(project);
    } catch (error) {
      next(error);
    }
  }
);

// Delete project
projectRouter.delete(
  '/:id',
  authorize(UserRole.ADMIN),
  async (req, res, next) => {
    try {
      await prisma.project.delete({ where: { id: req.params.id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

// Update project progress
projectRouter.patch('/:id/progress', authenticate, async (req, res, next) => {
  try {
    const { progress } = z.object({ progress: z.number().min(0).max(100) }).parse(req.body);

    const project = await prisma.project.update({
      where: { id: req.params.id },
      data: { progress },
    });

    res.json(project);
  } catch (error) {
    next(error);
  }
});

// Get project activity logs
projectRouter.get('/:id/activity', async (req, res, next) => {
  try {
    const { page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { projectId: req.params.id },
        include: {
          user: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.activityLog.count({ where: { projectId: req.params.id } }),
    ]);

    res.json({
      data: logs,
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
