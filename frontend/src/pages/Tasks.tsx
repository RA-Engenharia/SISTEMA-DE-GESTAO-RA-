import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import type { Task, PaginatedResponse } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const statusColors: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-purple-100 text-purple-800',
  DONE: 'bg-green-100 text-green-800',
  BLOCKED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  TODO: 'A Fazer',
  IN_PROGRESS: 'Em Andamento',
  REVIEW: 'Em Revisão',
  DONE: 'Concluída',
  BLOCKED: 'Bloqueada',
};

const priorityColors: Record<string, string> = {
  LOW: 'border-gray-300',
  MEDIUM: 'border-blue-400',
  HIGH: 'border-orange-400',
  URGENT: 'border-red-500',
};

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { search, status, priority, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Task>>('/tasks', {
        params: { search, status, priority, page, limit: 20 },
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tarefas</h1>
          <p className="text-gray-500">Gerencie as tarefas dos projetos</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Nova Tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="input w-full sm:w-40"
        >
          <option value="">Todos os status</option>
          <option value="TODO">A Fazer</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="REVIEW">Em Revisão</option>
          <option value="DONE">Concluída</option>
          <option value="BLOCKED">Bloqueada</option>
        </select>
        <select
          value={priority}
          onChange={(e) => {
            setPriority(e.target.value);
            setPage(1);
          }}
          className="input w-full sm:w-40"
        >
          <option value="">Todas prioridades</option>
          <option value="LOW">Baixa</option>
          <option value="MEDIUM">Média</option>
          <option value="HIGH">Alta</option>
          <option value="URGENT">Urgente</option>
        </select>
      </div>

      {/* Tasks list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data?.data.map((task) => (
              <div
                key={task.id}
                className={clsx(
                  'card flex flex-col sm:flex-row sm:items-center gap-4 border-l-4',
                  priorityColors[task.priority]
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <span className={clsx('badge', statusColors[task.status])}>
                      {statusLabels[task.status]}
                    </span>
                  </div>
                  {task.project && (
                    <p className="text-sm text-gray-500 mt-1">
                      {task.project.code} - {task.project.name}
                    </p>
                  )}
                  {task.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {task.assignee && (
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-700">
                          {task.assignee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{task.assignee.name}</span>
                    </div>
                  )}
                  {task.dueDate && (
                    <span
                      className={clsx(
                        new Date(task.dueDate) < new Date() && task.status !== 'DONE'
                          ? 'text-red-500 font-medium'
                          : ''
                      )}
                    >
                      {format(new Date(task.dueDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhuma tarefa encontrada</p>
            </div>
          )}

          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600">
                Página {page} de {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="btn-secondary"
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
