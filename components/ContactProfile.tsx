import React, { useState, useEffect } from 'react';
import { X, Mail, Phone, Building, Calendar, TrendingUp, FileText, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PixelButton from './ui/PixelButton';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    score: number;
    created_at: string;
}

interface Deal {
    id: string;
    title: string;
    value: number;
    stage: string;
    created_at: string;
}

interface Contract {
    id: string;
    title: string;
    status: string;
    mrr: number;
    start_date: string;
}

interface Activity {
    id: string;
    type: string;
    title: string;
    description: string;
    activity_date: string;
}

interface ContactProfileProps {
    isOpen: boolean;
    onClose: () => void;
    contactId: string;
}

const ContactProfile: React.FC<ContactProfileProps> = ({ isOpen, onClose, contactId }) => {
    const [contact, setContact] = useState<Contact | null>(null);
    const [deals, setDeals] = useState<Deal[]>([]);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && contactId) {
            fetchContactData();
        }
    }, [isOpen, contactId]);

    const fetchContactData = async () => {
        try {
            setLoading(true);

            // Buscar contato
            const { data: contactData, error: contactError } = await supabase
                .from('contacts')
                .select('*')
                .eq('id', contactId)
                .single();

            if (contactError) throw contactError;
            setContact(contactData);

            // Buscar deals
            const { data: dealsData } = await supabase
                .from('deals')
                .select('*')
                .eq('contact_id', contactId)
                .order('created_at', { ascending: false });

            if (dealsData) setDeals(dealsData);

            // Buscar contratos
            const { data: contractsData } = await supabase
                .from('contracts')
                .select('*')
                .eq('contact_id', contactId)
                .order('created_at', { ascending: false });

            if (contractsData) setContracts(contractsData);

            // Buscar atividades
            const { data: activitiesData } = await supabase
                .from('activities')
                .select('*')
                .eq('contact_id', contactId)
                .order('activity_date', { ascending: false })
                .limit(10);

            if (activitiesData) setActivities(activitiesData);
        } catch (error) {
            console.error('Erro ao buscar dados do contato:', error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const getStatusColor = (status: string) => {
        if (status === 'Quente') return 'bg-retro-red';
        if (status === 'Morno') return 'bg-retro-yellow';
        return 'bg-retro-cyan';
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'Call': return '📞';
            case 'Email': return '📧';
            case 'Meeting': return '🤝';
            case 'Note': return '📝';
            default: return '📌';
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-retro-bg border-4 border-black shadow-pixel max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-retro-bg border-b-4 border-black p-6 flex justify-between items-center">
                    <h2 className="font-header text-2xl text-retro-fg">Perfil do Contato</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-retro-surface border-2 border-black transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-retro-comment">Carregando...</div>
                ) : contact ? (
                    <div className="p-6 space-y-6">
                        {/* Informações Principais */}
                        <div className="bg-retro-surface border-4 border-black p-6">
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-16 h-16 bg-retro-bg border-2 border-black flex items-center justify-center text-2xl font-bold uppercase">
                                    {contact.name.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-header text-2xl mb-2">{contact.name}</h3>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-2 text-retro-fg">
                                            <Mail size={16} />
                                            <span>{contact.email || 'Sem email'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-retro-fg">
                                            <Phone size={16} />
                                            <span>{contact.phone || 'Sem telefone'}</span>
                                        </div>
                                        {contact.company && (
                                            <div className="flex items-center gap-2 text-retro-fg">
                                                <Building size={16} />
                                                <span>{contact.company}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`inline-block px-4 py-2 border-2 border-black font-bold ${
                                        deals.length > 0 
                                            ? deals[0].stage === 'Fechado' ? 'bg-retro-green' :
                                              deals[0].stage === 'Negociação' ? 'bg-retro-orange' :
                                              deals[0].stage === 'Proposta' ? 'bg-retro-yellow' :
                                              deals[0].stage === 'Qualificado' ? 'bg-retro-pink' :
                                              deals[0].stage === 'Contatado' ? 'bg-retro-purple' :
                                              'bg-retro-cyan'
                                            : getStatusColor(contact.status)
                                    }`}>
                                        {deals.length > 0 ? deals[0].stage : contact.status}
                                    </div>
                                    <div className="mt-2 text-2xl font-bold">{contact.score}</div>
                                    <div className="text-sm text-retro-comment">Score</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-retro-comment text-sm">
                                <Calendar size={14} />
                                <span>Cadastrado em {formatDate(contact.created_at)}</span>
                            </div>
                        </div>

                        {/* Estatísticas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-retro-surface border-4 border-black p-4 text-center">
                                <FileText className="mx-auto mb-2" size={24} />
                                <div className="text-2xl font-bold">{deals.length}</div>
                                <div className="text-sm text-retro-comment">Negócios</div>
                            </div>
                            <div className="bg-retro-surface border-4 border-black p-4 text-center">
                                <DollarSign className="mx-auto mb-2" size={24} />
                                <div className="text-2xl font-bold">{contracts.length}</div>
                                <div className="text-sm text-retro-comment">Contratos</div>
                            </div>
                            <div className="bg-retro-surface border-4 border-black p-4 text-center">
                                <TrendingUp className="mx-auto mb-2" size={24} />
                                <div className="text-2xl font-bold">{activities.length}</div>
                                <div className="text-sm text-retro-comment">Atividades</div>
                            </div>
                        </div>

                        {/* Negócios */}
                        {deals.length > 0 && (
                            <div className="bg-retro-surface border-4 border-black p-6">
                                <h4 className="font-header text-xl mb-4">Negócios</h4>
                                <div className="space-y-3">
                                    {deals.map(deal => (
                                        <div key={deal.id} className="bg-retro-bg border-2 border-black p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold">{deal.title}</div>
                                                    <div className="text-sm text-retro-comment">{deal.stage}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(Number(deal.value))}</div>
                                                    <div className="text-sm text-retro-comment">{formatDate(deal.created_at)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Contratos */}
                        {contracts.length > 0 && (
                            <div className="bg-retro-surface border-4 border-black p-6">
                                <h4 className="font-header text-xl mb-4">Contratos</h4>
                                <div className="space-y-3">
                                    {contracts.map(contract => (
                                        <div key={contract.id} className="bg-retro-bg border-2 border-black p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold">{contract.title}</div>
                                                    <div className="text-sm text-retro-comment">Status: {contract.status}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold">{formatCurrency(Number(contract.mrr))}</div>
                                                    <div className="text-sm text-retro-comment">MRR</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Atividades Recentes */}
                        {activities.length > 0 && (
                            <div className="bg-retro-surface border-4 border-black p-6">
                                <h4 className="font-header text-xl mb-4">Atividades Recentes</h4>
                                <div className="space-y-3">
                                    {activities.map(activity => (
                                        <div key={activity.id} className="bg-retro-bg border-2 border-black p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                                                <div className="flex-1">
                                                    <div className="font-bold">{activity.title}</div>
                                                    {activity.description && (
                                                        <div className="text-sm text-retro-comment mt-1">{activity.description}</div>
                                                    )}
                                                    <div className="text-xs text-retro-comment mt-2">{formatDate(activity.activity_date)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-8 text-center text-retro-comment">Contato não encontrado</div>
                )}
            </div>
        </div>
    );
};

export default ContactProfile;

