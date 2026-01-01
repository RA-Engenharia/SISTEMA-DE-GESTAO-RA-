import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/auth';
import api from '../services/api';
import { UserIcon, KeyIcon, BellIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface ProfileForm {
  name: string;
  phone?: string;
  department?: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, updateUser } = useAuthStore();

  const profileForm = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
      department: user?.department ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>();

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      const response = await api.patch(`/users/${user?.id}`, data);
      return response.data;
    },
    onSuccess: (data) => {
      updateUser(data);
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(data.currentPassword, data.newPassword),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Senha alterada com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao alterar senha. Verifique a senha atual.');
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onPasswordSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não conferem');
      return;
    }
    changePasswordMutation.mutate({
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  };

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: UserIcon },
    { id: 'password', name: 'Senha', icon: KeyIcon },
    { id: 'notifications', name: 'Notificações', icon: BellIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500">Gerencie sua conta e preferências</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tabs */}
        <div className="md:w-48 flex-shrink-0">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors',
                  activeTab === tab.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Informações do Perfil</h2>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <div>
                  <label className="label">Nome</label>
                  <input
                    {...profileForm.register('name', { required: true })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email ?? ''}
                    disabled
                    className="input bg-gray-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    O email não pode ser alterado
                  </p>
                </div>
                <div>
                  <label className="label">Telefone</label>
                  <input
                    {...profileForm.register('phone')}
                    className="input"
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <label className="label">Departamento</label>
                  <input
                    {...profileForm.register('department')}
                    className="input"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary"
                  >
                    {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Alterar Senha</h2>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div>
                  <label className="label">Senha Atual</label>
                  <input
                    {...passwordForm.register('currentPassword', { required: true })}
                    type="password"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Nova Senha</label>
                  <input
                    {...passwordForm.register('newPassword', {
                      required: true,
                      minLength: 8,
                    })}
                    type="password"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mínimo de 8 caracteres
                  </p>
                </div>
                <div>
                  <label className="label">Confirmar Nova Senha</label>
                  <input
                    {...passwordForm.register('confirmPassword', { required: true })}
                    type="password"
                    className="input"
                  />
                </div>
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary"
                  >
                    {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="card">
              <h2 className="text-lg font-semibold mb-6">Preferências de Notificação</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Notificações por Email</p>
                    <p className="text-sm text-gray-500">
                      Receba atualizações importantes por email
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <div>
                    <p className="font-medium">Tarefas Atribuídas</p>
                    <p className="text-sm text-gray-500">
                      Notificar quando uma tarefa for atribuída a você
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">Prazos de Projetos</p>
                    <p className="text-sm text-gray-500">
                      Lembrete de prazos próximos
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
