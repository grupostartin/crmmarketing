import React, { useEffect, useState } from 'react';
import PixelButton from '../components/ui/PixelButton';
import { Filter, Download, Mail, Phone, Tag, Trash2, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContactModal from '../components/ContactModal';
import ContactProfile from '../components/ContactProfile';
import ActivityModal from '../components/ActivityModal';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company?: string;
    score: number;
    status: string;
    created_at: string;
}

const Contacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [showProfile, setShowProfile] = useState(false);
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [deleteWarning, setDeleteWarning] = useState<{ contactId: string; hasRelations: boolean } | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const { checkLimit } = usePlanLimits();
    const navigate = useNavigate();

    useEffect(() => {
        fetchContacts();
    }, []);

    useEffect(() => {
        filterContacts();
    }, [contacts, searchTerm, statusFilter]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.filter-menu-container')) {
                setShowFilterMenu(false);
            }
        };

        if (showFilterMenu) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilterMenu]);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            // RLS policies automatically filter by user_id
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            const contactsData = data || [];
            setContacts(contactsData);
            setFilteredContacts(contactsData);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterContacts = () => {
        let filtered = [...contacts];

        // Aplicar busca
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(contact =>
                contact.name.toLowerCase().includes(term) ||
                contact.email?.toLowerCase().includes(term) ||
                contact.phone?.toLowerCase().includes(term) ||
                contact.company?.toLowerCase().includes(term)
            );
        }

        // Aplicar filtro de status
        if (statusFilter !== 'all') {
            filtered = filtered.filter(contact => contact.status === statusFilter);
        }

        setFilteredContacts(filtered);
    };

    const handleExport = () => {
        const csvLines: string[] = [];

        // Cabeçalho
        csvLines.push('RELATÓRIO DE CONTATOS');
        csvLines.push(`Data de Exportação: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`);
        csvLines.push('');

        // Cabeçalhos das colunas
        csvLines.push('Nome,Email,Telefone,Empresa,Status,Score,Data de Criação');

        // Dados
        filteredContacts.forEach(contact => {
            const escapeCsv = (str: string) => (str || '').replace(/"/g, '""');
            const date = new Date(contact.created_at).toLocaleDateString('pt-BR');
            csvLines.push(
                `"${escapeCsv(contact.name)}","${escapeCsv(contact.email || '')}","${escapeCsv(contact.phone || '')}","${escapeCsv(contact.company || '')}","${escapeCsv(contact.status)}",${contact.score},${date}`
            );
        });

        // Converter para CSV e fazer download
        const csvContent = csvLines.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `contatos_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleViewProfile = (contactId: string) => {
        setSelectedContactId(contactId);
        setShowProfile(true);
    };

    const handleRegisterActivity = (contactId: string) => {
        setSelectedContactId(contactId);
        setShowActivityModal(true);
    };

    const checkContactRelations = async (contactId: string) => {
        const [dealsResult, contractsResult, activitiesResult] = await Promise.all([
            supabase.from('deals').select('id').eq('contact_id', contactId).limit(1),
            supabase.from('contracts').select('id').eq('contact_id', contactId).limit(1),
            supabase.from('activities').select('id').eq('contact_id', contactId).limit(1),
        ]);

        const hasDeals = (dealsResult.data?.length || 0) > 0;
        const hasContracts = (contractsResult.data?.length || 0) > 0;
        const hasActivities = (activitiesResult.data?.length || 0) > 0;

        return hasDeals || hasContracts || hasActivities;
    };

    const handleDeleteContact = async (contactId: string) => {
        try {
            // Verificar se tem relacionamentos
            const hasRelations = await checkContactRelations(contactId);

            if (hasRelations) {
                // Mostrar aviso
                setDeleteConfirm(null);
                setDeleteWarning({ contactId, hasRelations: true });
                return;
            }

            // Se não tem relacionamentos, deletar diretamente
            await deleteContactAndRelations(contactId);
        } catch (error) {
            console.error('Erro ao deletar contato:', error);
            alert('Erro ao deletar contato.');
        }
    };

    const deleteContactAndRelations = async (contactId: string) => {
        try {
            // Deletar relacionamentos primeiro
            await Promise.all([
                supabase.from('activities').delete().eq('contact_id', contactId),
                supabase.from('deals').delete().eq('contact_id', contactId),
                supabase.from('contracts').delete().eq('contact_id', contactId),
                supabase.from('quiz_responses').delete().eq('contact_id', contactId),
            ]);

            // Deletar o contato
            const { error } = await supabase
                .from('contacts')
                .delete()
                .eq('id', contactId);

            if (error) throw error;

            // Atualizar lista de contatos
            setContacts(contacts.filter(c => c.id !== contactId));
            setDeleteConfirm(null);
            setDeleteWarning(null);
        } catch (error) {
            console.error('Erro ao deletar contato:', error);
            alert('Erro ao deletar contato.');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const handleAddContact = () => {
        if (checkLimit('clients', contacts.length)) {
            setShowLimitModal(true);
            return;
        }
        setIsModalOpen(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-header text-3xl text-retro-fg">Contatos</h1>
                    <p className="text-retro-comment text-lg">Visualize e gerencie seus leads.</p>
                </div>
                <PixelButton variant="primary" onClick={handleAddContact}>+ Adicionar Contato</PixelButton>
            </div>

            {/* Filter Bar */}
            <div className="bg-retro-surface border-4 border-black p-4 shadow-pixel flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar contatos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-retro-bg border-2 border-black px-4 py-2 text-lg focus:border-retro-cyan outline-none"
                        />
                    </div>
                    <div className="relative filter-menu-container">
                        <PixelButton
                            variant="secondary"
                            className="flex items-center gap-2"
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                        >
                            <Filter size={16} /> Filtrar
                        </PixelButton>
                        {showFilterMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-retro-bg border-4 border-black shadow-pixel z-10 min-w-[200px]">
                                <div className="p-2">
                                    <div className="text-sm font-bold mb-2 text-retro-fg">Filtrar por Status</div>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('all');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'all' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Todos
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Lead');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Lead' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Lead
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Quente');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Quente' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Quente
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Morno');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Morno' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Morno
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Frio');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Frio' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Frio
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Qualificado');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Qualificado' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Qualificado
                                    </button>
                                    <button
                                        onClick={() => {
                                            setStatusFilter('Fechado');
                                            setShowFilterMenu(false);
                                        }}
                                        className={`w-full text-left px-3 py-2 hover:bg-retro-surface ${statusFilter === 'Fechado' ? 'bg-retro-cyan text-black' : ''}`}
                                    >
                                        Fechado
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <PixelButton variant="secondary" className="flex items-center gap-2" onClick={handleExport}>
                        <Download size={16} /> Exportar
                    </PixelButton>
                </div>
            </div>

            {/* Contact Grid */}
            {loading ? (
                <div className="text-center py-10 text-retro-comment animate-pulse">Carregando contatos...</div>
            ) : filteredContacts.length === 0 ? (
                <div className="text-center py-20 border-4 border-dashed border-retro-comment/30 rounded-lg">
                    <p className="text-retro-comment text-xl mb-4">
                        {contacts.length === 0
                            ? 'Nenhum contato encontrado.'
                            : 'Nenhum contato corresponde aos filtros aplicados.'}
                    </p>
                    {contacts.length === 0 && (
                        <PixelButton variant="primary" onClick={handleAddContact}>Adicionar o primeiro</PixelButton>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContacts.map((contact) => (
                        <div key={contact.id} className="bg-retro-surface border-4 border-black p-0 shadow-pixel group relative hover:-translate-y-1 transition-transform">
                            {/* Header Bar based on Temperature */}
                            <div className={`h-2 w-full border-b-4 border-black ${contact.status === 'Quente' ? 'bg-retro-red' :
                                contact.status === 'Morno' ? 'bg-retro-yellow' : 'bg-retro-cyan'
                                }`}></div>

                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-retro-bg border-2 border-black flex items-center justify-center text-xl font-bold uppercase">
                                            {contact.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl leading-none">{contact.name}</h3>
                                            <p className="text-retro-comment text-sm">{formatDate(contact.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className={`
                                            w-10 h-10 flex items-center justify-center border-2 border-black font-bold text-lg shadow-pixel-sm
                                            ${contact.status === 'Quente' ? 'bg-retro-red text-black' :
                                                contact.status === 'Morno' ? 'bg-retro-yellow text-black' : 'bg-retro-cyan text-black'}
                                        `}>
                                            {contact.score}
                                        </div>
                                        <button
                                            onClick={() => setDeleteConfirm(contact.id)}
                                            className="p-2 hover:bg-retro-red/20 border-2 border-black transition-colors"
                                            title="Excluir contato"
                                        >
                                            <Trash2 size={16} className="text-retro-red" />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-6">
                                    <div className="flex items-center gap-2 text-retro-fg">
                                        <Mail size={16} className="text-retro-comment" />
                                        <span className="text-lg truncate">{contact.email || 'Sem email'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-retro-fg">
                                        <Phone size={16} className="text-retro-comment" />
                                        <span className="text-lg">{contact.phone || 'Sem telefone'}</span>
                                    </div>
                                </div>

                                <div className="border-t-4 border-black -mx-6 -mb-6 bg-retro-bg p-3 flex justify-between">
                                    <button
                                        onClick={() => handleViewProfile(contact.id)}
                                        className="flex-1 text-center hover:text-retro-cyan transition-colors font-header text-xs uppercase"
                                    >
                                        Ver Perfil
                                    </button>
                                    <div className="w-1 bg-black self-stretch"></div>
                                    <button
                                        onClick={() => handleRegisterActivity(contact.id)}
                                        className="flex-1 text-center hover:text-retro-pink transition-colors font-header text-xs uppercase"
                                    >
                                        Registrar Atividade
                                    </button>
                                </div>
                            </div>

                            {/* Confirmação de exclusão */}
                            {deleteConfirm === contact.id && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 border-4 border-black">
                                    <div className="bg-retro-bg border-4 border-black p-6 max-w-sm mx-4">
                                        <h3 className="font-header text-xl mb-4 text-retro-fg">Confirmar Exclusão</h3>
                                        <p className="text-retro-comment mb-6">
                                            Tem certeza que deseja excluir o contato <strong>{contact.name}</strong>? Esta ação não pode ser desfeita.
                                        </p>
                                        <div className="flex gap-3">
                                            <PixelButton
                                                variant="secondary"
                                                onClick={() => setDeleteConfirm(null)}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </PixelButton>
                                            <PixelButton
                                                variant="danger"
                                                onClick={() => handleDeleteContact(contact.id)}
                                                className="flex-1"
                                            >
                                                Excluir
                                            </PixelButton>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Aviso de relacionamentos */}
                            {deleteWarning?.contactId === contact.id && (
                                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10 border-4 border-black">
                                    <div className="bg-retro-bg border-4 border-black p-6 max-w-sm mx-4">
                                        <h3 className="font-header text-xl mb-4 text-retro-red">⚠️ Atenção</h3>
                                        <p className="text-retro-comment mb-4">
                                            O contato <strong>{contact.name}</strong> está vinculado a negócios, contratos ou atividades.
                                        </p>
                                        <p className="text-retro-comment mb-6 font-bold">
                                            Ao excluir, todos os relacionamentos serão removidos permanentemente. Deseja continuar?
                                        </p>
                                        <div className="flex gap-3">
                                            <PixelButton
                                                variant="secondary"
                                                onClick={() => {
                                                    setDeleteWarning(null);
                                                    setDeleteConfirm(null);
                                                }}
                                                className="flex-1"
                                            >
                                                Cancelar
                                            </PixelButton>
                                            <PixelButton
                                                variant="danger"
                                                onClick={() => deleteContactAndRelations(contact.id)}
                                                className="flex-1"
                                            >
                                                Sim, Excluir Tudo
                                            </PixelButton>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <ContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchContacts}
            />

            {selectedContactId && (
                <>
                    <ContactProfile
                        isOpen={showProfile}
                        onClose={() => {
                            setShowProfile(false);
                            setSelectedContactId(null);
                        }}
                        contactId={selectedContactId}
                    />
                    <ActivityModal
                        isOpen={showActivityModal}
                        onClose={() => {
                            setShowActivityModal(false);
                            setSelectedContactId(null);
                        }}
                        contactId={selectedContactId}
                        onSuccess={fetchContacts}
                    />
                </>
            )}

            {/* Limit Modal */}
            {showLimitModal && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-md mx-4 relative">
                        <div className="absolute -top-6 -left-6 bg-retro-yellow border-4 border-black p-2 shadow-pixel">
                            <Lock size={32} className="text-black" />
                        </div>
                        <h3 className="font-header text-2xl text-retro-fg mb-4 mt-2">Limite Atingido</h3>
                        <p className="text-retro-comment mb-6 text-lg">
                            Você atingiu o limite de <strong>5 Clientes</strong> do plano Grátis.
                            <br /><br />
                            Faça upgrade para o plano <strong>Pro</strong> para gerenciar clientes ilimitados e desbloquear todos os recursos.
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

export default Contacts;