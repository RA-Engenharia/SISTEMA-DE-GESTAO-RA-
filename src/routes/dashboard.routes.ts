import { Router } from 'express';
import { prisma } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { ProjectStatus, TaskStatus } from '@prisma/client';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate);

// Get dashboard statistics
dashboardRouter.get('/stats', async (req, res, next) => {
  try {
    const [
      totalProjects,
      activeProjects,
      completedProjects,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      totalClients,
      activeClients,
      totalUsers,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { status: ProjectStatus.IN_PROGRESS } }),
      prisma.project.count({ where: { status: ProjectStatus.COMPLETED } }),
      prisma.task.count(),
      prisma.task.count({ where: { status: TaskStatus.TODO } }),
      prisma.task.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      prisma.task.count({ where: { status: TaskStatus.DONE } }),
      prisma.client.count(),
      prisma.client.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: true } }),
    ]);

    res.json({
      projects: {
        total: totalProjects,
        active: activeProjects,
        completed: completedProjects,
      },
      tasks: {
        total: totalTasks,
        pending: pendingTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },
      clients: {
        total: totalClients,
        active: activeClients,
      },
      users: {
        total: totalUsers,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get recent activity
dashboardRouter.get('/activity', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await prisma.activityLog.findMany({
      include: {
        user: {
          select: { id: true, name: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, code: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(activities);
  } catch (error) {
    next(error);
  }
});

// Get projects by status
dashboardRouter.get('/projects-by-status', async (_req, res, next) => {
  try {
    const projectsByStatus = await prisma.project.groupBy({
      by: ['status'],
      _count: true,
    });

    const result = Object.values(ProjectStatus).map((status) => ({
      status,
      count: projectsByStatus.find((p) => p.status === status)?._count ?? 0,
    }));

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get tasks by priority
dashboardRouter.get('/tasks-by-priority', async (_req, res, next) => {
  try {
    const tasksByPriority = await prisma.task.groupBy({
      by: ['priority'],
      _count: true,
      where: { status: { not: TaskStatus.DONE } },
    });

    res.json(tasksByPriority.map((t) => ({
      priority: t.priority,
      count: t._count,
    })));
  } catch (error) {
    next(error);
  }
});

// Get overdue tasks
dashboardRouter.get('/overdue-tasks', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { not: TaskStatus.DONE },
      },
      include: {
        project: {
          select: { id: true, name: true, code: true },
        },
        assignee: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { dueDate: 'asc' },
      take: limit,
    });

    res.json(overdueTasks);
  } catch (error) {
    next(error);
  }
});

// Get my notifications
dashboardRouter.get('/notifications', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where: Record<string, unknown> = {
      userId: req.user!.userId,
    };

    if (unreadOnly) {
      where.read = false;
    }

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      prisma.notification.count({
        where: { userId: req.user!.userId, read: false },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
dashboardRouter.patch('/notifications/:id/read', async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data: { read: true },
    });

    res.json(notification);
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
dashboardRouter.post('/notifications/mark-all-read', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
});
