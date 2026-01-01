import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlusIcon, MagnifyingGlassIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import api from '../services/api';
import type { Client, PaginatedResponse } from '../types';
import clsx from 'clsx';

export default function Clients() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['clients', { search, page }],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<Client>>('/clients', {
        params: { search, page, limit: 10 },
      });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gerencie os clientes da empresa</p>
        </div>
        <button className="btn-primary">
          <PlusIcon className="w-5 h-5 mr-2" />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar clientes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="input pl-10"
        />
      </div>

      {/* Clients list */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((client) => (
              <div key={client.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-primary-50">
                    <BuildingOfficeIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {client.name}
                      </h3>
                      <span
                        className={clsx(
                          'badge',
                          client.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        )}
                      >
                        {client.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    {client.document && (
                      <p className="text-sm text-gray-500 mt-1">{client.document}</p>
                    )}
                    {client.email && (
                      <p className="text-sm text-gray-600 mt-2">{client.email}</p>
                    )}
                    {client.phone && (
                      <p className="text-sm text-gray-600">{client.phone}</p>
                    )}
                  </div>
                </div>

                {client.city && (
                  <p className="text-sm text-gray-500 mt-4">
                    {client.city}, {client.state}
                  </p>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t text-sm text-gray-500">
                  <span>{client._count?.projects ?? 0} projetos</span>
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    Ver detalhes
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data?.data.length === 0 && (
            <div className="text-center py-12">
              <BuildingOfficeIcon className="w-12 h-12 text-gray-300 mx-auto" />
              <p className="text-gray-500 mt-4">Nenhum cliente encontrado</p>
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
