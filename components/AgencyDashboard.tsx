import React, { useState } from 'react';
import { useAgency, Role } from '../context/AgencyContext';
import PixelButton from './ui/PixelButton';
import PixelCard from './ui/PixelCard';
import { Users, Plus, Trash2, Crown, Briefcase, User, Edit2, Save, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const AgencyDashboard = () => {
  const { agency, members, currentUserRole, loading, addMember, removeMember, updateAgencyName, refresh } = useAgency();
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<Role>('staff');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showCreateAgency, setShowCreateAgency] = useState(false);
  const [newAgencyName, setNewAgencyName] = useState('');
  const [creatingAgency, setCreatingAgency] = useState(false);

  const canManageMembers = currentUserRole === 'owner' || currentUserRole === 'manager';
  const canEditAgency = currentUserRole === 'owner';

  const handleAddMember = async () => {
    if (!newMemberUserId.trim()) {
      setError('User ID é obrigatório');
      return;
    }

    try {
      setError(null);
      await addMember(newMemberUserId.trim(), newMemberRole);
      setNewMemberUserId('');
      setNewMemberRole('staff');
      setShowAddMember(false);
    } catch (err: any) {
      console.error('Error adding member:', err);
      // Melhorar mensagens de erro
      let errorMessage = 'Erro ao adicionar membro';
      if (err.message?.includes('já é membro')) {
        errorMessage = err.message;
      } else if (err.message?.includes('violates row-level security')) {
        errorMessage = 'Você não tem permissão para adicionar este tipo de membro';
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  const handleRemoveMember = async (memberId: string, memberRole: Role) => {
    if (!confirm('Tem certeza que deseja remover este membro?')) return;

    // Verificar permissões
    if (currentUserRole === 'manager' && memberRole !== 'staff') {
      alert('Gerentes só podem remover membros com papel de staff');
      return;
    }

    try {
      await removeMember(memberId);
    } catch (err: any) {
      alert(err.message || 'Erro ao remover membro');
    }
  };

  const handleStartEditName = () => {
    if (agency) {
      setEditedName(agency.name);
      setIsEditingName(true);
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) {
      setError('Nome da agência não pode estar vazio');
      return;
    }

    try {
      setError(null);
      await updateAgencyName(editedName.trim());
      setIsEditingName(false);
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar nome da agência');
    }
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setEditedName('');
    setError(null);
  };

  const getRoleIcon = (role: Role) => {
    switch (role) {
      case 'owner':
        return <Crown size={16} className="text-retro-yellow" />;
      case 'manager':
        return <Briefcase size={16} className="text-retro-cyan" />;
      case 'staff':
        return <User size={16} className="text-retro-comment" />;
    }
  };

  const getRoleLabel = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'Dono';
      case 'manager':
        return 'Gerente';
      case 'staff':
        return 'Geral';
    }
  };

  const getRoleBadgeColor = (role: Role) => {
    switch (role) {
      case 'owner':
        return 'bg-retro-yellow text-black';
      case 'manager':
        return 'bg-retro-cyan text-black';
      case 'staff':
        return 'bg-retro-comment text-white';
    }
  };

  const handleCreateAgency = async () => {
    if (!newAgencyName.trim()) {
      setError('Nome da agência é obrigatório');
      return;
    }

    try {
      setCreatingAgency(true);
      setError(null);
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) throw new Error('Usuário não autenticado');

      // Usar a função RPC create_agency
      const { data, error: rpcError } = await supabase.rpc('create_agency', {
        p_name: newAgencyName.trim(),
        p_owner_id: user.user.id,
      });

      if (rpcError) {
        // Melhorar mensagem de erro
        if (rpcError.message?.includes('duplicate') || rpcError.code === '23505') {
          throw new Error('Você já pertence a uma agência');
        }
        throw rpcError;
      }

      // Aguardar um pouco antes de recarregar para garantir que a transação foi commitada
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Recarregar dados com tratamento de erro
      try {
        await refresh();
      } catch (refreshError) {
        console.error('Error refreshing after agency creation:', refreshError);
        // Não mostrar erro ao usuário se a agência foi criada com sucesso
        // O refresh pode falhar temporariamente mas a agência já existe
      }
      
      setShowCreateAgency(false);
      setNewAgencyName('');
      setCreatingAgency(false);
    } catch (err: any) {
      console.error('Error creating agency:', err);
      setError(err.message || 'Erro ao criar agência');
      setCreatingAgency(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-retro-comment text-xl">Carregando dados da agência...</p>
      </div>
    );
  }

  if (!agency && !showCreateAgency) {
    return (
      <div className="space-y-8">
        <div className="bg-retro-surface border-4 border-black p-8 shadow-pixel text-center">
          <h2 className="font-header text-2xl text-retro-fg mb-4">Você não pertence a nenhuma agência</h2>
          <p className="text-retro-comment mb-6">Crie uma nova agência ou entre em contato com um administrador para ser adicionado a uma existente.</p>
          <PixelButton variant="primary" onClick={() => setShowCreateAgency(true)}>
            Criar Nova Agência
          </PixelButton>
        </div>
      </div>
    );
  }

  if (showCreateAgency) {
    return (
      <div className="space-y-8">
        <div className="bg-retro-surface border-4 border-black p-8 shadow-pixel">
          <h2 className="font-header text-2xl text-retro-fg mb-6">Criar Nova Agência</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-retro-comment text-sm mb-2 uppercase">
                Nome da Agência
              </label>
              <input
                type="text"
                value={newAgencyName}
                onChange={(e) => setNewAgencyName(e.target.value)}
                placeholder="Ex: Minha Agência"
                className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                autoFocus
              />
            </div>
            {error && <p className="text-retro-red text-sm">{error}</p>}
            <div className="flex gap-3">
              <PixelButton
                variant="primary"
                onClick={handleCreateAgency}
                disabled={creatingAgency}
                className="flex-1"
              >
                {creatingAgency ? 'Criando...' : 'Criar Agência'}
              </PixelButton>
              <PixelButton
                variant="secondary"
                onClick={() => {
                  setShowCreateAgency(false);
                  setNewAgencyName('');
                  setError(null);
                }}
                className="flex-1"
              >
                Cancelar
              </PixelButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="font-header text-3xl text-retro-fg">Dashboard da Agência</h1>
      </div>

      {/* Agency Info */}
      <PixelCard>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            {isEditingName ? (
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="flex-1 bg-retro-bg border-2 border-black p-2 text-xl text-retro-fg focus:border-retro-cyan outline-none"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-2 bg-retro-green hover:bg-retro-green/90 text-black border-2 border-black transition-colors"
                  title="Salvar"
                >
                  <Save size={18} />
                </button>
                <button
                  onClick={handleCancelEditName}
                  className="p-2 bg-retro-red hover:bg-retro-red/90 text-white border-2 border-black transition-colors"
                  title="Cancelar"
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h2 className="font-header text-2xl text-retro-fg">{agency.name}</h2>
                {canEditAgency && (
                  <button
                    onClick={handleStartEditName}
                    className="p-1 hover:bg-retro-surface border-2 border-transparent hover:border-black transition-colors"
                    title="Editar nome"
                  >
                    <Edit2 size={16} className="text-retro-comment" />
                  </button>
                )}
              </div>
            )}
            {error && <p className="text-retro-red text-sm mt-2">{error}</p>}
          </div>
        </div>
      </PixelCard>

      {/* Members Section */}
      <PixelCard title="Membros da Agência">
        <div className="space-y-4">
          {canManageMembers && (
            <div className="flex justify-end">
              <PixelButton
                variant="primary"
                onClick={() => setShowAddMember(!showAddMember)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar Membro
              </PixelButton>
            </div>
          )}

          {showAddMember && (
            <div className="bg-retro-bg border-2 border-black p-4 space-y-4">
              <h3 className="font-header text-lg text-retro-fg">Adicionar Novo Membro</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-retro-comment text-sm mb-2 uppercase">
                    User ID (UUID do usuário)
                  </label>
                  <input
                    type="text"
                    value={newMemberUserId}
                    onChange={(e) => setNewMemberUserId(e.target.value)}
                    placeholder="00000000-0000-0000-0000-000000000000"
                    className="w-full bg-retro-surface border-2 border-black p-2 text-retro-fg focus:border-retro-cyan outline-none"
                  />
                  <p className="text-retro-comment text-xs mt-1">
                    Por enquanto, é necessário inserir o UUID do usuário. Em breve, será possível buscar por email.
                  </p>
                </div>
                <div>
                  <label className="block text-retro-comment text-sm mb-2 uppercase">
                    Papel
                  </label>
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value as Role)}
                    className="w-full bg-retro-surface border-2 border-black p-2 text-retro-fg focus:border-retro-cyan outline-none"
                    disabled={currentUserRole !== 'owner'}
                  >
                    {currentUserRole === 'owner' && <option value="owner">Dono</option>}
                    {currentUserRole === 'owner' && <option value="manager">Gerente</option>}
                    <option value="staff">Geral</option>
                  </select>
                  {currentUserRole === 'manager' && (
                    <p className="text-retro-comment text-xs mt-1">
                      Gerentes só podem adicionar membros com papel "Geral"
                    </p>
                  )}
                </div>
                {error && <p className="text-retro-red text-sm">{error}</p>}
                <div className="flex gap-3">
                  <PixelButton
                    variant="primary"
                    onClick={handleAddMember}
                    className="flex-1"
                  >
                    Adicionar
                  </PixelButton>
                  <PixelButton
                    variant="secondary"
                    onClick={() => {
                      setShowAddMember(false);
                      setNewMemberUserId('');
                      setError(null);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </PixelButton>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {members.length === 0 ? (
              <p className="text-retro-comment text-center py-8">
                Nenhum membro encontrado.
              </p>
            ) : (
              members.map((member) => {
                const canRemove =
                  currentUserRole === 'owner' ||
                  (currentUserRole === 'manager' && member.role === 'staff');

                return (
                  <div
                    key={member.id}
                    className="bg-retro-surface border-2 border-black p-4 flex justify-between items-center hover:bg-retro-bg/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-retro-bg border-2 border-black">
                        {getRoleIcon(member.role)}
                      </div>
                      <div>
                        <p className="font-bold text-retro-fg">
                          {member.email || member.auth_user_id.substring(0, 8) + '...'}
                        </p>
                        <p className="text-retro-comment text-sm">
                          {member.auth_user_id}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 text-xs font-bold uppercase border-2 border-black shadow-pixel-sm ${getRoleBadgeColor(
                          member.role
                        )}`}
                      >
                        {getRoleLabel(member.role)}
                      </span>
                      {canRemove && (
                        <button
                          onClick={() => handleRemoveMember(member.id, member.role)}
                          className="p-2 hover:bg-retro-red/20 border-2 border-transparent hover:border-black transition-colors"
                          title="Remover membro"
                        >
                          <Trash2 size={16} className="text-retro-red" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </PixelCard>
    </div>
  );
};

export default AgencyDashboard;

