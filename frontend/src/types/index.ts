export type UserRole = 'ADMIN' | 'MANAGER' | 'ENGINEER' | 'TECHNICIAN' | 'VIEWER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE' | 'BLOCKED';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type DocumentType = 'CONTRACT' | 'PROPOSAL' | 'TECHNICAL_REPORT' | 'INVOICE' | 'CERTIFICATE' | 'PLAN' | 'OTHER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  department?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  notes?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    projects: number;
  };
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  code: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  estimatedCost?: number;
  actualCost?: number;
  progress: number;
  address?: string;
  city?: string;
  state?: string;
  notes?: string;
  clientId?: string;
  managerId?: string;
  client?: Pick<Client, 'id' | 'name'>;
  manager?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
  _count?: {
    tasks: number;
    documents: number;
  };
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  estimatedHours?: number;
  actualHours?: number;
  order: number;
  projectId: string;
  assigneeId?: string;
  creatorId: string;
  parentId?: string;
  project?: Pick<Project, 'id' | 'name' | 'code'>;
  assignee?: Pick<User, 'id' | 'name' | 'avatar'>;
  creator?: Pick<User, 'id' | 'name'>;
  subtasks?: Task[];
  comments?: Comment[];
  tags?: { tag: Tag }[];
  _count?: {
    subtasks: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  authorId: string;
  author?: Pick<User, 'id' | 'name' | 'avatar'>;
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  description?: string;
  type: DocumentType;
  filePath: string;
  fileSize: number;
  mimeType: string;
  version: number;
  projectId?: string;
  uploadedById: string;
  project?: Pick<Project, 'id' | 'name' | 'code'>;
  uploadedBy?: Pick<User, 'id' | 'name'>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  userId: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
  userId?: string;
  projectId?: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  project?: Pick<Project, 'id' | 'name' | 'code'>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DashboardStats {
  projects: {
    total: number;
    active: number;
    completed: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
  clients: {
    total: number;
    active: number;
  };
  users: {
    total: number;
  };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
