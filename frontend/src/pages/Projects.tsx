import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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

export default function Projects() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['projects', { search, status, page }],
    queryFn: () => projectsService.getAll({ search, status, page, limit: 10 }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-500">Gerencie os projetos da empresa</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Projeto
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar projetos..."
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
          className="input w-full sm:w-48"
        >
          <option value="">Todos os status</option>
          <option value="PLANNING">Planejamento</option>
          <option value="IN_PROGRESS">Em Andamento</option>
          <option value="ON_HOLD">Pausado</option>
          <option value="COMPLETED">Concluído</option>
          <option value="CANCELLED">Cancelado</option>
        </select>
      </div>

      {/* Projects list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="card hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-500 font-mono">{project.code}</p>
                    <h3 className="text-lg font-semibold text-gray-900 mt-1">
                      {project.name}
                    </h3>
                  </div>
                  <span
                    className={clsx('badge', statusColors[project.status] ?? 'bg-gray-100')}
                  >
                    {statusLabels[project.status] ?? project.status}
                  </span>
                </div>

                {project.client && (
                  <p className="text-sm text-gray-600 mt-2">
                    Cliente: {project.client.name}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Progresso</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="mt-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                  <span>{project._count?.tasks ?? 0} tarefas</span>
                  {project.endDate && (
                    <span>
                      Prazo:{' '}
                      {format(new Date(project.endDate), 'dd/MM/yyyy', {
                        locale: ptBR,
                      })}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum projeto encontrado</p>
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
