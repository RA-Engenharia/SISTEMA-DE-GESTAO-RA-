import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import type { User, PaginatedResponse } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import clsx from 'clsx';

const roleLabels: Record<string, string> = {
  ADMIN: 'Administrador',
  MANAGER: 'Gerente',
  ENGINEER: 'Engenheiro',
  TECHNICIAN: 'Técnico',
  VIEWER: 'Visualizador',
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-purple-100 text-purple-800',
  ENGINEER: 'bg-blue-100 text-blue-800',
  TECHNICIAN: 'bg-green-100 text-green-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

export default function Users() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', { search, role, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<User>>('/users', {
        params: { search, role, page, limit: 20 },
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-500">Gerencie os usuários do sistema</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Usuário
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar usuários..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          className="input w-full sm:w-48"
        >
          <option value="">Todos os perfis</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gerente</option>
          <option value="ENGINEER">Engenheiro</option>
          <option value="TECHNICIAN">Técnico</option>
          <option value="VIEWER">Visualizador</option>
        </select>
      </div>

      {/* Users list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((user) => (
              <div key={user.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-6 h-6 text-primary-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {user.name}
                      </h3>
                      <span
                        className={clsx(
                          'badge',
                          user.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {user.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 truncate">{user.email}</p>
                    <span className={clsx('badge mt-2', roleColors[user.role])}>
                      {roleLabels[user.role] ?? user.role}
                    </span>
                  </div>
                </div>

                {user.department && (
                  <p className="text-sm text-gray-500 mt-4">{user.department}</p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                  {user.lastLoginAt ? (
                    <span>
                      Último acesso:{' '}
                      {format(new Date(user.lastLoginAt), "dd/MM/yyyy HH:mm", {
                        locale: ptBR,
                      })}
                    </span>
                  ) : (
                    <span>Nunca acessou</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="text-center py-12">
              <UserIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-4">Nenhum usuário encontrado</p>
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
