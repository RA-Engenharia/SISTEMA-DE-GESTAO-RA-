import api from './api';
import type { DashboardStats, ActivityLog, Task, Notification } from '../types';

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  getRecentActivity: async (limit = 10): Promise<ActivityLog[]> => {
    const { data } = await api.get<ActivityLog[]>('/dashboard/activity', {
      params: { limit },
    });
    return data;
  },

  getProjectsByStatus: async (): Promise<{ status: string; count: number }[]> => {
    const { data } = await api.get<{ status: string; count: number }[]>(
      '/dashboard/projects-by-status'
    );
    return data;
  },

  getTasksByPriority: async (): Promise<{ priority: string; count: number }[]> => {
    const { data } = await api.get<{ priority: string; count: number }[]>(
      '/dashboard/tasks-by-priority'
    );
    return data;
  },

  getOverdueTasks: async (limit = 10): Promise<Task[]> => {
    const { data } = await api.get<Task[]>('/dashboard/overdue-tasks', {
      params: { limit },
    });
    return data;
  },

  getNotifications: async (limit = 20, unreadOnly = false) => {
    const { data } = await api.get<{
      notifications: Notification[];
      unreadCount: number;
    }>('/dashboard/notifications', {
      params: { limit, unreadOnly },
    });
    return data;
  },

  markNotificationRead: async (id: string): Promise<Notification> => {
    const { data } = await api.patch<Notification>(
      `/dashboard/notifications/${id}/read`
    );
    return data;
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await api.post('/dashboard/notifications/mark-all-read');
  },
};
