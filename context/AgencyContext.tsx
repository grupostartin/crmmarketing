import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export type Role = 'owner' | 'manager' | 'staff';

export type Agency = {
  id: string;
  name: string;
  subscription_tier: 'free' | 'pro';
  subscription_status: string;
};

export type Member = {
  id: string;
  auth_user_id: string;
  role: Role;
  email: string | null;
};

interface AgencyContextProps {
  agency: Agency | null;
  members: Member[];
  currentUserRole: Role | null;
  loading: boolean;
  refresh: () => Promise<void>;
  addMember: (authUserId: string, role: Role) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  updateAgencyName: (name: string) => Promise<void>;
}

const AgencyContext = createContext<AgencyContextProps | undefined>(undefined);

export const AgencyProvider = ({ children }: { children: ReactNode }) => {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: user, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error getting user:', userError);
        return;
      }
      
      if (!user?.user) {
        setAgency(null);
        setMembers([]);
        setCurrentUserRole(null);
        return;
      }

      // Buscar agência via agency_users
      const { data: au, error: auError } = await supabase
        .from('agency_users')
        .select('agency_id, role')
        .eq('auth_user_id', user.user.id)
        .maybeSingle();

      // Se não encontrou registro (PGRST116), não é erro - usuário simplesmente não tem agência
      if (auError) {
        // PGRST116 = nenhum resultado encontrado (não é um erro crítico)
        if (auError.code === 'PGRST116') {
          setAgency(null);
          setMembers([]);
          setCurrentUserRole(null);
          return;
        }
        // Outros erros são críticos
        console.error('Error fetching agency_user:', auError);
        throw auError;
      }

      if (!au) {
        setAgency(null);
        setMembers([]);
        setCurrentUserRole(null);
        return;
      }

      setCurrentUserRole(au.role as Role);

      // Buscar dados da agência
      const { data: ag, error: agError } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('id', au.agency_id)
        .maybeSingle();

      if (agError) {
        // PGRST116 = nenhum resultado encontrado
        if (agError.code === 'PGRST116') {
          console.warn('Agency not found for user');
          setAgency(null);
          setMembers([]);
          setCurrentUserRole(null);
          return;
        }
        console.error('Error fetching agency:', agError);
        throw agError;
      }

      if (ag) {
        setAgency(ag as Agency);

        // Buscar membros da agência
        const { data: mem, error: memError } = await supabase
          .from('agency_users')
          .select('id, auth_user_id, role')
          .eq('agency_id', ag.id);

        if (memError) {
          console.error('Error fetching members:', memError);
          // Não lançar erro aqui, apenas logar - já temos a agência carregada
        } else if (mem) {
          // Buscar emails dos usuários (via auth.users - precisamos de uma view ou função)
          // Por enquanto, vamos buscar do perfil se existir
          const memberPromises = mem.map(async (m) => {
            // Tentar buscar email do auth.users via RPC ou usar uma view
            // Por enquanto, vamos deixar email como null e buscar depois se necessário
            return {
              id: m.id,
              auth_user_id: m.auth_user_id,
              role: m.role as Role,
              email: null as string | null,
            };
          });

          try {
            const membersList = await Promise.all(memberPromises);
            setMembers(membersList);
          } catch (memberError) {
            console.error('Error processing members:', memberError);
            // Não lançar erro, apenas usar os dados que conseguimos obter
            setMembers(mem.map(m => ({
              id: m.id,
              auth_user_id: m.auth_user_id,
              role: m.role as Role,
              email: null,
            })));
          }
        }
      }
    } catch (error: any) {
      // Só logar erros inesperados
      if (error?.code !== 'PGRST116') {
        console.error('Error loading agency data:', error);
      }
      // Não resetar estado em caso de erro - manter o que já estava carregado
      // Isso evita que o ErrorBoundary capture erros esperados
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Escutar mudanças na tabela agency_users
    if (supabase) {
      const channel = supabase
        .channel('agency_users_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'agency_users',
          },
          () => {
            loadData();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const addMember = async (authUserId: string, role: Role) => {
    if (!agency) throw new Error('No agency found');

    const { error } = await supabase.from('agency_users').insert({
      agency_id: agency.id,
      auth_user_id: authUserId,
      role,
    });

    if (error) {
      // Melhorar mensagem de erro
      if (error.code === '23505') {
        throw new Error('Este usuário já é membro desta agência');
      }
      throw error;
    }
    
    // Aguardar um pouco antes de recarregar para garantir que a transação foi commitada
    await new Promise(resolve => setTimeout(resolve, 300));
    await loadData();
  };

  const removeMember = async (memberId: string) => {
    const { error } = await supabase
      .from('agency_users')
      .delete()
      .eq('id', memberId);

    if (error) throw error;
    await loadData();
  };

  const updateAgencyName = async (name: string) => {
    if (!agency) throw new Error('No agency found');

    const { error } = await supabase
      .from('agencies')
      .update({ name })
      .eq('id', agency.id);

    if (error) throw error;
    await loadData();
  };

  return (
    <AgencyContext.Provider
      value={{
        agency,
        members,
        currentUserRole,
        loading,
        refresh: loadData,
        addMember,
        removeMember,
        updateAgencyName,
      }}
    >
      {children}
    </AgencyContext.Provider>
  );
};

export const useAgency = () => {
  const ctx = useContext(AgencyContext);
  if (!ctx) throw new Error('useAgency must be used within AgencyProvider');
  return ctx;
};

