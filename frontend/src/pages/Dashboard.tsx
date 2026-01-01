import { useQuery } from '@tanstack/react-query';
import {
  FolderIcon,
  ClipboardDocumentListIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { dashboardService } from '../services/dashboard';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PLANNING: 'Planejamento',
  IN_PROGRESS: 'Em Andamento',
  ON_HOLD: 'Pausado',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: projectsByStatus } = useQuery({
    queryKey: ['projects-by-status'],
    queryFn: dashboardService.getProjectsByStatus,
  });

  const { data: overdueTasks } = useQuery({
    queryKey: ['overdue-tasks'],
    queryFn: () => dashboardService.getOverdueTasks(5),
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => dashboardService.getRecentActivity(10),
  });

  const statCards = [
    {
      name: 'Total de Projetos',
      value: stats?.projects.total ?? 0,
      subValue: `${stats?.projects.active ?? 0} ativos`,
      icon: FolderIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Tarefas Pendentes',
      value: (stats?.tasks.pending ?? 0) + (stats?.tasks.inProgress ?? 0),
      subValue: `${stats?.tasks.completed ?? 0} concluídas`,
      icon: ClipboardDocumentListIcon,
      color: 'bg-amber-500',
    },
    {
      name: 'Clientes',
      value: stats?.clients.total ?? 0,
      subValue: `${stats?.clients.active ?? 0} ativos`,
      icon: BuildingOfficeIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Usuários',
      value: stats?.users.total ?? 0,
      subValue: 'ativos no sistema',
      icon: UsersIcon,
      color: 'bg-purple-500',
    },
  ];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral do sistema</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className={clsx('p-3 rounded-lg', stat.color)}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.subValue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Projects by status */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Projetos por Status
          </h2>
          <div className="space-y-3">
            {projectsByStatus?.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span
                    className={clsx(
                      'badge',
                      statusColors[item.status] ?? 'bg-gray-100'
                    )}
                  >
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </div>
                <span className="font-semibold text-gray-900">{item.count}</span>
              </div>
            ))}
            {(!projectsByStatus || projectsByStatus.length === 0) && (
              <p className="text-gray-500 text-center py-4">Nenhum projeto encontrado</p>
            )}
          </div>
        </div>

        {/* Overdue tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Tarefas Atrasadas
            </h2>
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-500" />
          </div>
          <div className="space-y-3">
            {overdueTasks?.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  <p className="text-sm text-gray-500">{task.project?.name}</p>
                </div>
                <div className="text-right">
                  <span className={clsx('badge', priorityColors[task.priority])}>
                    {task.priority}
                  </span>
                  {task.dueDate && (
                    <p className="text-xs text-red-500 mt-1">
                      Venceu em{' '}
                      {format(new Date(task.dueDate), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {(!overdueTasks || overdueTasks.length === 0) && (
              <p className="text-gray-500 text-center py-4">
                Nenhuma tarefa atrasada
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Atividade Recente
        </h2>
        <div className="space-y-4">
          {recentActivity?.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-primary-700">
                  {activity.user?.name?.charAt(0).toUpperCase() ?? '?'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.user?.name ?? 'Sistema'}</span>{' '}
                  {activity.action.toLowerCase()} {activity.entity.toLowerCase()}
                </p>
                {activity.project && (
                  <p className="text-xs text-gray-500">
                    Projeto: {activity.project.name}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-400">
                {format(new Date(activity.createdAt), "dd/MM HH:mm", {
                  locale: ptBR,
                })}
              </p>
            </div>
          ))}
          {(!recentActivity || recentActivity.length === 0) && (
            <p className="text-gray-500 text-center py-4">
              Nenhuma atividade recente
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
