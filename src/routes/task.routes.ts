import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { TaskStatus, TaskPriority } from '@prisma/client';

export const taskRouter = Router();

taskRouter.use(authenticate);

const taskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  status: z.nativeEnum(TaskStatus).default(TaskStatus.TODO),
  priority: z.nativeEnum(TaskPriority).default(TaskPriority.MEDIUM),
  dueDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  estimatedHours: z.number().positive().optional(),
  projectId: z.string().uuid(),
  assigneeId: z.string().uuid().optional(),
  parentId: z.string().uuid().optional(),
});

// List tasks (with filters)
taskRouter.get('/', async (req, res, next) => {
  try {
    const {
      projectId,
      status,
      priority,
      assigneeId,
      search,
      page = '1',
      limit = '50',
    } = req.query;

    const where: Record<string, unknown> = {};

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    if (status && typeof status === 'string') {
      where.status = status as TaskStatus;
    }

    if (priority && typeof priority === 'string') {
      where.priority = priority as TaskPriority;
    }

    if (assigneeId && typeof assigneeId === 'string') {
      where.assigneeId = assigneeId;
    }

    if (search && typeof search === 'string') {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          project: {
            select: { id: true, name: true, code: true },
          },
          assignee: {
            select: { id: true, name: true, avatar: true },
          },
          creator: {
            select: { id: true, name: true },
          },
          tags: {
            include: { tag: true },
          },
          _count: {
            select: { subtasks: true, comments: true },
          },
        },
        orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limitNum,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({
      data: tasks,
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

// Get my tasks
taskRouter.get('/my-tasks', async (req, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: req.user!.userId,
        status: { not: TaskStatus.DONE },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        tags: {
          include: { tag: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' },
      ],
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get task by ID
taskRouter.get('/:id', async (req, res, next) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        creator: {
          select: { id: true, name: true },
        },
        parentTask: {
          select: { id: true, title: true },
        },
        subtasks: {
          include: {
            assignee: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { order: 'asc' },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        tags: {
          include: { tag: true },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Create task
taskRouter.post('/', async (req, res, next) => {
  try {
    const data = taskSchema.parse(req.body);

    // Get the highest order for tasks in this project
    const lastTask = await prisma.task.findFirst({
      where: { projectId: data.projectId, parentId: data.parentId ?? null },
      orderBy: { order: 'desc' },
    });

    const task = await prisma.task.create({
      data: {
        ...data,
        creatorId: req.user!.userId,
        order: (lastTask?.order ?? 0) + 1,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        startDate: data.startDate ? new Date(data.startDate) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Create notification for assignee
    if (data.assigneeId && data.assigneeId !== req.user!.userId) {
      await prisma.notification.create({
        data: {
          userId: data.assigneeId,
          title: 'Nova tarefa atribuída',
          message: `Você foi atribuído à tarefa "${task.title}"`,
          type: 'task',
          link: `/projects/${task.projectId}/tasks/${task.id}`,
        },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'TASK',
        entityId: task.id,
        userId: req.user!.userId,
        projectId: task.projectId,
        details: { title: task.title },
      },
    });

    res.status(201).json(task);
  } catch (error) {
    next(error);
  }
});

// Update task
taskRouter.patch('/:id', async (req, res, next) => {
  try {
    const data = taskSchema.partial().parse(req.body);

    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        ...data,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        completedAt: data.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE
          ? new Date()
          : data.status !== TaskStatus.DONE
          ? null
          : undefined,
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true },
        },
      },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'TASK',
        entityId: task.id,
        userId: req.user!.userId,
        projectId: task.projectId,
        details: data,
      },
    });

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Update task status
taskRouter.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = z.object({ status: z.nativeEnum(TaskStatus) }).parse(req.body);

    const existingTask = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!existingTask) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE
          ? new Date()
          : status !== TaskStatus.DONE
          ? null
          : undefined,
      },
    });

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Reorder tasks
taskRouter.post('/reorder', async (req, res, next) => {
  try {
    const schema = z.object({
      tasks: z.array(z.object({
        id: z.string().uuid(),
        order: z.number(),
      })),
    });

    const { tasks } = schema.parse(req.body);

    await prisma.$transaction(
      tasks.map((t) =>
        prisma.task.update({
          where: { id: t.id },
          data: { order: t.order },
        })
      )
    );

    res.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    next(error);
  }
});

// Delete task
taskRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.task.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

// Add comment to task
taskRouter.post('/:id/comments', async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);

    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'TASK_NOT_FOUND');
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId: req.params.id,
        authorId: req.user!.userId,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    next(error);
  }
});
