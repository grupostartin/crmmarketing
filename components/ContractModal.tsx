import React, { useState, useEffect } from 'react';
import { X, FileText, Save, DollarSign, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../context/AgencyContext';

interface Contact {
    id: string;
    name: string;
}

interface ContractModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    contractId?: string;
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose, onSuccess, contractId }) => {
    const { agency } = useAgency();
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [formData, setFormData] = useState({
        contact_id: '',
        title: '',
        mrr: 0,
        status: 'Ativo',
        start_date: new Date().toISOString().split('T')[0],
        renewal_date: ''
    });

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
            if (contractId) {
                fetchContract();
            } else {
                resetForm();
            }
        }
    }, [isOpen, contractId]);

    const fetchContract = async () => {
        try {
            const { data, error } = await supabase
                .from('contracts')
                .select('*')
                .eq('id', contractId)
                .single();

            if (error) throw error;

            if (data) {
                setFormData({
                    contact_id: data.contact_id || '',
                    title: data.title || '',
                    mrr: Number(data.mrr) || 0,
                    status: data.status || 'Ativo',
                    start_date: data.start_date ? data.start_date.split('T')[0] : new Date().toISOString().split('T')[0],
                    renewal_date: data.renewal_date ? data.renewal_date.split('T')[0] : ''
                });
            }
        } catch (error) {
            console.error('Erro ao buscar contrato:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            contact_id: '',
            title: '',
            mrr: 0,
            status: 'Ativo',
            start_date: new Date().toISOString().split('T')[0],
            renewal_date: ''
        });
    };

    const fetchContacts = async () => {
        const { data } = await supabase
            .from('contacts')
            .select('id, name')
            .order('name');
        if (data) setContacts(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            if (contractId) {
                // Atualizar contrato existente
                const { error } = await supabase
                    .from('contracts')
                    .update({
                        contact_id: formData.contact_id,
                        title: formData.title,
                        mrr: formData.mrr,
                        status: formData.status,
                        start_date: formData.start_date,
                        renewal_date: formData.renewal_date || null
                    })
                    .eq('id', contractId);

                if (error) throw error;
            } else {
                // Criar novo contrato
                if (!agency) {
                    throw new Error('Você precisa estar associado a uma agência para adicionar contratos');
                }

                const { error } = await supabase
                    .from('contracts')
                    .insert([
                        {
                            ...formData,
                            user_id: user.id,
                            agency_id: agency.id,
                            created_at: new Date().toISOString()
                        }
                    ]);

                if (error) throw error;
            }

            onSuccess();
            onClose();
            resetForm();
        } catch (error) {
            console.error('Error saving contract:', error);
            alert(contractId ? 'Erro ao atualizar contrato' : 'Erro ao adicionar contrato');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-retro-surface border-4 border-black shadow-pixel w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <div className="bg-retro-bg border-b-4 border-black p-4 flex justify-between items-center">
                    <h2 className="font-header text-xl text-retro-fg uppercase">{contractId ? 'Editar Contrato' : 'Novo Contrato'}</h2>
                    <button onClick={onClose} className="text-retro-comment hover:text-retro-red transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Cliente</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-retro-comment" />
                            </div>
                            <select
                                value={formData.contact_id}
                                onChange={(e) => setFormData({ ...formData, contact_id: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg appearance-none"
                                required
                            >
                                <option value="">Selecione um cliente...</option>
                                {contacts.map(contact => (
                                    <option key={contact.id} value={contact.id}>{contact.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Título do Contrato</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={18} className="text-retro-comment" />
                            </div>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                placeholder="Ex: Gestão de Tráfego"
                                required
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Valor (MRR)</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign size={18} className="text-retro-comment" />
                                </div>
                                <input
                                    type="number"
                                    value={formData.mrr}
                                    onChange={(e) => setFormData({ ...formData, mrr: parseFloat(e.target.value) })}
                                    className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Status</label>
                            <select
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg px-3 py-2 outline-none font-body text-lg"
                            >
                                <option value="Ativo">Ativo</option>
                                <option value="Negociando">Negociando</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Início</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-retro-comment" />
                                </div>
                                <input
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Renovação</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Calendar size={18} className="text-retro-comment" />
                                </div>
                                <input
                                    type="date"
                                    value={formData.renewal_date}
                                    onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-retro-bg border-2 border-black text-retro-comment hover:text-retro-fg py-2 font-header text-sm uppercase transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-retro-green hover:bg-retro-green/90 text-black font-header text-sm py-2 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all flex items-center justify-center gap-2 uppercase"
                        >
                            {loading ? 'Salvando...' : 'Salvar'}
                            {!loading && <Save size={16} />}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ContractModal;
