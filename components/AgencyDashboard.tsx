import React, { useState } from 'react';
import { useAgency, Role } from '../context/AgencyContext';
import PixelButton from './ui/PixelButton';
import PixelCard from './ui/PixelCard';
import { Users, Plus, Trash2, Crown, Briefcase, User, Edit2, Save, X, Link as LinkIcon, Copy, Check, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

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
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteRole, setInviteRole] = useState<Role>('staff');
  const [generatedLink, setGeneratedLink] = useState('');
  const [copyingLink, setCopyingLink] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const { checkLimit } = usePlanLimits();
  const navigate = useNavigate();

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

  const handleGenerateInvite = async () => {
    if (!agency) return;

    try {
      const token = crypto.randomUUID();
      // Calculate expiration (e.g., 7 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const { error } = await supabase
        .from('agency_invitations')
        .insert({
          agency_id: agency.id,
          token: token,
          role: inviteRole,
          expires_at: expiresAt.toISOString()
        });

      if (error) throw error;

      const link = `${window.location.origin}/invite/${token}`;
      setGeneratedLink(link);
    } catch (err: any) {
      console.error('Error generating invite:', err);
      alert('Erro ao gerar convite: ' + err.message);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopyingLink(true);
      setTimeout(() => setCopyingLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setGeneratedLink('');
    setInviteRole('staff');
  };

  const handleOpenInviteModal = () => {
    if (checkLimit('users', members.length)) {
      setShowLimitModal(true);
      return;
    }
    setShowInviteModal(true);
  };

  const handleToggleAddMember = () => {
    if (!showAddMember && checkLimit('users', members.length)) {
      setShowLimitModal(true);
      return;
    }
    setShowAddMember(!showAddMember);
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
            <div className="flex justify-end gap-3">
              <PixelButton
                variant="secondary"
                onClick={handleOpenInviteModal}
                className="flex items-center gap-2"
              >
                <LinkIcon size={16} />
                Convidar via Link
              </PixelButton>
              <PixelButton
                variant="primary"
                onClick={handleToggleAddMember}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Adicionar por ID
              </PixelButton>
            </div>
          )}

          {showInviteModal && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in p-4">
              <div className="bg-retro-surface border-4 border-black p-6 shadow-pixel max-w-md w-full animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-header text-xl text-retro-fg">Gerar Link de Convite</h3>
                  <button onClick={closeInviteModal} className="text-retro-comment hover:text-retro-red">
                    <X size={24} />
                  </button>
                </div>

                {!generatedLink ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-retro-comment text-sm mb-2 uppercase">
                        Papel do Membro
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as Role)}
                        className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                        disabled={currentUserRole !== 'owner'}
                      >
                        {currentUserRole === 'owner' && <option value="owner">Dono</option>}
                        {currentUserRole === 'owner' && <option value="manager">Gerente</option>}
                        <option value="staff">Geral</option>
                      </select>
                      {currentUserRole === 'manager' && (
                        <p className="text-retro-comment text-xs mt-1">
                          Gerentes só podem convidar membros com papel "Geral"
                        </p>
                      )}
                    </div>

                    <PixelButton
                      variant="primary"
                      className="w-full"
                      onClick={handleGenerateInvite}
                    >
                      Gerar Link
                    </PixelButton>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-retro-comment text-sm">
                      Compartilhe este link com a pessoa que você deseja convidar.
                      O link expira em 7 dias.
                    </p>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generatedLink}
                        readOnly
                        className="flex-1 bg-retro-bg border-2 border-black p-3 text-sm font-mono text-retro-fg"
                      />
                      <button
                        onClick={handleCopyLink}
                        className="bg-retro-cyan hover:bg-retro-cyan/90 text-black font-header text-sm py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2"
                      >
                        {copyingLink ? <Check size={16} /> : <Copy size={16} />}
                      </button>
                    </div>

                    <PixelButton
                      variant="secondary"
                      className="w-full"
                      onClick={closeInviteModal}
                    >
                      Fechar
                    </PixelButton>
                  </div>
                )}
              </div>
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

      {/* Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
          <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-md mx-4 relative">
            <div className="absolute -top-6 -left-6 bg-retro-yellow border-4 border-black p-2 shadow-pixel">
              <Lock size={32} className="text-black" />
            </div>
            <h3 className="font-header text-2xl text-retro-fg mb-4 mt-2">Limite Atingido</h3>
            <p className="text-retro-comment mb-6 text-lg">
              Você atingiu o limite de <strong>3 Usuários</strong> do plano Grátis.
              <br /><br />
              Faça upgrade para o plano <strong>Pro</strong> para adicionar membros ilimitados e desbloquear todos os recursos.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => navigate('/plans')}
                className="flex-1 bg-retro-cyan hover:bg-retro-cyan/90 text-black font-bold py-3 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
              >
                Ver Planos
              </button>
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 bg-retro-surface hover:bg-retro-comment/20 text-retro-fg font-bold py-3 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyDashboard;

