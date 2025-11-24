import React, { useState, useEffect } from 'react';
import { Plus, Filter, Download, MoreVertical, AlertTriangle, DollarSign, Calendar, TrendingDown, Edit, Trash2, FileDown, Lock } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';
import ContractModal from '../components/ContractModal';
import { supabase } from '../lib/supabase';
import { usePlanLimits } from '../hooks/usePlanLimits';
import { useNavigate } from 'react-router-dom';

interface Contract {
    id: string;
    title: string;
    mrr: number;
    status: string;
    start_date: string;
    renewal_date: string;
    contact: {
        name: string;
    };
}

const Contracts = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContractId, setEditingContractId] = useState<string | null>(null);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Ativo');
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showLimitModal, setShowLimitModal] = useState(false);

    const { checkLimit } = usePlanLimits();
    const navigate = useNavigate();

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('contracts')
                .select(`
                    *,
                    contact:contacts(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContracts(data || []);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    // KPIs Calculation
    const totalMRR = contracts
        .filter(c => c.status === 'Ativo')
        .reduce((sum, c) => sum + (c.mrr || 0), 0);

    const renewals30d = contracts.filter(c => {
        if (!c.renewal_date || c.status !== 'Ativo') return false;
        const today = new Date();
        const renewal = new Date(c.renewal_date);
        const diffTime = renewal.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30;
    }).length;

    const churnRate = contracts.length > 0
        ? ((contracts.filter(c => c.status === 'Cancelado').length / contracts.length) * 100).toFixed(1)
        : '0.0';

    const filteredContracts = contracts.filter(c => {
        if (activeTab === 'Ativos') return c.status === 'Ativo';
        if (activeTab === 'Em Negociação') return c.status === 'Negociando';
        if (activeTab === 'Cancelados') return c.status === 'Cancelado';
        return true; // Default or 'Todos'
    });

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    const handleExport = (contractId?: string) => {
        try {
            const contractsToExport = contractId
                ? contracts.filter(c => c.id === contractId)
                : contracts;

            const headers = ['Cliente', 'Título', 'MRR', 'Status', 'Início', 'Renovação'];
            const csvContent = [
                headers.join(','),
                ...contractsToExport.map(c => {
                    const escapeCsv = (str: string) => (str || '').replace(/"/g, '""');
                    return [
                        `"${escapeCsv(c.contact?.name || '')}"`,
                        `"${escapeCsv(c.title)}"`,
                        c.mrr,
                        c.status,
                        c.start_date || '',
                        c.renewal_date || ''
                    ].join(',');
                })
            ].join('\n');

            // Add BOM for Excel compatibility
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', contractId ? `contrato_${contractId}.csv` : 'contratos.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setOpenMenuId(null);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Erro ao exportar CSV');
        }
    };

    const handleEdit = (contractId: string) => {
        setEditingContractId(contractId);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const handleDelete = async (contractId: string) => {
        try {
            const { error } = await supabase
                .from('contracts')
                .delete()
                .eq('id', contractId);

            if (error) throw error;

            setContracts(contracts.filter(c => c.id !== contractId));
            setDeleteConfirm(null);
            setOpenMenuId(null);
        } catch (error) {
            console.error('Erro ao deletar contrato:', error);
            alert('Erro ao deletar contrato');
        }
    };

    const handleNewContract = () => {
        if (checkLimit('contracts', contracts.length)) {
            setShowLimitModal(true);
            return;
        }
        setIsModalOpen(true);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.actions-menu-container')) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="font-header text-3xl text-retro-fg">Gestão de Contratos</h1>
                <div className="flex gap-4">
                    <PixelButton variant="secondary" onClick={() => handleExport()}>
                        <Download size={16} className="mr-2" /> EXPORTAR CSV
                    </PixelButton>
                    <PixelButton variant="primary" onClick={handleNewContract}>
                        <Plus size={16} className="mr-2" /> NOVO CONTRATO
                    </PixelButton>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-retro-surface border-4 border-black p-6 shadow-pixel relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-retro-comment text-sm uppercase">MRR Total Ativo</p>
                            <h2 className="font-header text-3xl text-retro-fg mt-1">{formatCurrency(totalMRR)}</h2>
                        </div>
                        <DollarSign className="text-retro-green" size={24} />
                    </div>
                    <p className="text-retro-green text-sm flex items-center gap-1">
                        <span className="text-xs">▲</span> +2,5%
                    </p>
                </div>

                <div className="bg-retro-surface border-4 border-black p-6 shadow-pixel relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-retro-comment text-sm uppercase">Renovações (30d)</p>
                            <h2 className="font-header text-3xl text-retro-fg mt-1">{renewals30d}</h2>
                        </div>
                        <Calendar className="text-retro-yellow" size={24} />
                    </div>
                    {renewals30d > 0 && (
                        <p className="text-retro-yellow text-sm flex items-center gap-1">
                            <AlertTriangle size={12} /> Ação Necessária
                        </p>
                    )}
                </div>

                <div className="bg-retro-surface border-4 border-black p-6 shadow-pixel relative overflow-hidden">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-retro-comment text-sm uppercase">Taxa de Churn</p>
                            <h2 className="font-header text-3xl text-retro-fg mt-1">{churnRate}%</h2>
                        </div>
                        <TrendingDown className="text-retro-red" size={24} />
                    </div>
                    <p className="text-retro-red text-sm flex items-center gap-1">
                        <span className="text-xs">▼</span> -1,1%
                    </p>
                </div>
            </div>

            {/* Contracts List */}
            <div className="bg-retro-surface border-4 border-black shadow-pixel">
                {/* Tabs */}
                <div className="flex border-b-4 border-black bg-retro-bg">
                    {['Ativos', 'Em Negociação', 'Cancelados'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-header text-sm uppercase transition-colors ${activeTab === tab
                                ? 'bg-retro-surface text-retro-cyan border-r-4 border-black'
                                : 'text-retro-comment hover:text-retro-fg hover:bg-retro-surface/50 border-r-4 border-black'
                                }`}
                        >
                            {tab} ({contracts.filter(c => {
                                if (tab === 'Ativos') return c.status === 'Ativo';
                                if (tab === 'Em Negociação') return c.status === 'Negociando';
                                if (tab === 'Cancelados') return c.status === 'Cancelado';
                                return false;
                            }).length})
                        </button>
                    ))}
                </div>

                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-4 border-b-4 border-black bg-retro-bg/50 text-retro-comment text-sm uppercase tracking-wider font-bold">
                    <div className="col-span-3">Nome do Cliente</div>
                    <div className="col-span-2">Data de Início</div>
                    <div className="col-span-2">MRR</div>
                    <div className="col-span-2">Renovação</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-1 text-center">Ações</div>
                </div>

                {/* Table Body */}
                <div className="divide-y-2 divide-black">
                    {loading ? (
                        <div className="p-8 text-center text-retro-comment">Carregando contratos...</div>
                    ) : filteredContracts.length === 0 ? (
                        <div className="p-8 text-center text-retro-comment">Nenhum contrato encontrado nesta categoria.</div>
                    ) : (
                        filteredContracts.map((contract) => (
                            <div key={contract.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-retro-bg/30 transition-colors group">
                                <div className="col-span-3 font-bold text-retro-fg">{contract.contact?.name || 'Cliente Removido'}</div>
                                <div className="col-span-2 text-retro-comment">{formatDate(contract.start_date)}</div>
                                <div className="col-span-2 text-retro-green font-bold">{formatCurrency(contract.mrr)}</div>
                                <div className="col-span-2 text-retro-comment">{formatDate(contract.renewal_date)}</div>
                                <div className="col-span-2">
                                    <span className={`px-2 py-1 text-xs font-bold uppercase border-2 border-black shadow-pixel-sm ${contract.status === 'Ativo' ? 'bg-retro-green text-black' :
                                        contract.status === 'Negociando' ? 'bg-retro-yellow text-black' :
                                            'bg-retro-red text-black'
                                        }`}>
                                        {contract.status}
                                    </span>
                                </div>
                                <div className="col-span-1 text-center relative actions-menu-container">
                                    <button
                                        onClick={() => setOpenMenuId(openMenuId === contract.id ? null : contract.id)}
                                        className="text-retro-comment hover:text-retro-fg transition-colors"
                                    >
                                        <MoreVertical size={18} />
                                    </button>
                                    {openMenuId === contract.id && (
                                        <div className="absolute right-0 top-full mt-2 bg-retro-bg border-4 border-black shadow-pixel z-50 min-w-[180px]">
                                            <button
                                                onClick={() => handleEdit(contract.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-retro-surface flex items-center gap-2 text-retro-fg"
                                            >
                                                <Edit size={16} />
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => handleExport(contract.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-retro-surface flex items-center gap-2 text-retro-fg"
                                            >
                                                <FileDown size={16} />
                                                Exportar
                                            </button>
                                            <div className="border-t-2 border-black"></div>
                                            <button
                                                onClick={() => setDeleteConfirm(contract.id)}
                                                className="w-full text-left px-4 py-2 hover:bg-retro-red/20 flex items-center gap-2 text-retro-red"
                                            >
                                                <Trash2 size={16} />
                                                Excluir
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <ContractModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setEditingContractId(null);
                }}
                onSuccess={() => {
                    fetchContracts();
                    setEditingContractId(null);
                }}
                contractId={editingContractId || undefined}
            />

            {/* Confirmação de exclusão */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-retro-bg border-4 border-black shadow-pixel max-w-sm w-full p-6">
                        <h3 className="font-header text-xl mb-4 text-retro-fg">Confirmar Exclusão</h3>
                        <p className="text-retro-comment mb-6">
                            Tem certeza que deseja excluir este contrato? Esta ação não pode ser desfeita.
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
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1"
                            >
                                Excluir
                            </PixelButton>
                        </div>
                    </div>
                </div>
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
                            Você atingiu o limite de <strong>5 Contratos</strong> do plano Grátis.
                            <br /><br />
                            Faça upgrade para o plano <strong>Pro</strong> para gerenciar contratos ilimitados e desbloquear todos os recursos.
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

export default Contracts;