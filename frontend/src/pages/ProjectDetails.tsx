import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { projectsService } from '../services/projects';
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

const taskStatusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  DONE: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

export default function ProjectDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsService.getById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Projeto não encontrado</p>
        <Link to="/projects" className="btn-primary mt-4">
          Voltar para projetos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Link>
          <div>
            <p className="text-sm text-gray-500 font-mono">{project.code}</p>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
        </div>
        <span
          className={clsx('badge text-sm', statusColors[project.status] ?? 'bg-gray-100')}
        >
          {statusLabels[project.status] ?? project.status}
        </span>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {project.client && (
          <div className="card">
            <div className="flex items-center text-gray-500 mb-2">
              <UserIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">Cliente</span>
            </div>
            <p className="font-semibold">{project.client.name}</p>
          </div>
        )}

        {project.startDate && (
          <div className="card">
            <div className="flex items-center text-gray-500 mb-2">
              <CalendarIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">Período</span>
            </div>
            <p className="font-semibold">
              {format(new Date(project.startDate), 'dd/MM/yyyy', { locale: ptBR })}
              {project.endDate && (
                <> - {format(new Date(project.endDate), 'dd/MM/yyyy', { locale: ptBR })}</>
              )}
            </p>
          </div>
        )}

        {project.estimatedCost && (
          <div className="card">
            <div className="flex items-center text-gray-500 mb-2">
              <CurrencyDollarIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">Custo Estimado</span>
            </div>
            <p className="font-semibold">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(Number(project.estimatedCost))}
            </p>
          </div>
        )}

        {project.city && (
          <div className="card">
            <div className="flex items-center text-gray-500 mb-2">
              <MapPinIcon className="w-4 h-4 mr-2" />
              <span className="text-sm">Localização</span>
            </div>
            <p className="font-semibold">
              {project.city}, {project.state}
            </p>
          </div>
        )}
      </div>

      {/* Progress */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Progresso do Projeto</h2>
          <span className="text-2xl font-bold text-primary-600">{project.progress}%</span>
        </div>
        <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-500 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Descrição</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
        </div>
      )}

      {/* Tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Tarefas ({project._count?.tasks ?? 0})
          </h2>
          <button className="btn-primary text-sm">Nova Tarefa</button>
        </div>
        <div className="space-y-3">
          {project.tasks?.map((task) => (
            <div
              key={task.id}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div
                  className={clsx(
                    'w-2 h-2 rounded-full',
                    task.status === 'DONE' ? 'bg-green-500' : 'bg-gray-400'
                  )}
                />
                <div>
                  <p className="font-medium text-gray-900">{task.title}</p>
                  {task.assignee && (
                    <p className="text-sm text-gray-500">{task.assignee.name}</p>
                  )}
                </div>
              </div>
              <span className={clsx('badge', taskStatusColors[task.status])}>
                {task.status}
              </span>
            </div>
          ))}
          {(!project.tasks || project.tasks.length === 0) && (
            <p className="text-gray-500 text-center py-4">Nenhuma tarefa cadastrada</p>
          )}
        </div>
      </div>

      {/* Manager */}
      {project.manager && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Responsável</h2>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-sm font-medium text-primary-700">
                {project.manager.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium">{project.manager.name}</p>
              <p className="text-sm text-gray-500">{project.manager.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
