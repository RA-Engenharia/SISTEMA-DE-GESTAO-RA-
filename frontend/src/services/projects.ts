import api from './api';
import type { Project, PaginatedResponse } from '../types';

export interface ProjectFilters {
  search?: string;
  status?: string;
  clientId?: string;
  managerId?: string;
  page?: number;
  limit?: number;
}

export interface CreateProjectData {
  name: string;
  code: string;
  description?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  clientId?: string;
  managerId?: string;
}

export const projectsService = {
  getAll: async (filters: ProjectFilters = {}): Promise<PaginatedResponse<Project>> => {
    const { data } = await api.get<PaginatedResponse<Project>>('/projects', {
      params: filters,
    });
    return data;
  },

  getById: async (id: string): Promise<Project> => {
    const { data } = await api.get<Project>(`/projects/${id}`);
    return data;
  },

  create: async (projectData: CreateProjectData): Promise<Project> => {
    const { data } = await api.post<Project>('/projects', projectData);
    return data;
  },

  update: async (id: string, projectData: Partial<CreateProjectData>): Promise<Project> => {
    const { data } = await api.patch<Project>(`/projects/${id}`, projectData);
    return data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  updateProgress: async (id: string, progress: number): Promise<Project> => {
    const { data } = await api.patch<Project>(`/projects/${id}/progress`, { progress });
    return data;
  },
};
