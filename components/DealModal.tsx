import React, { useState, useEffect } from 'react';
import { X, FileText, Save, DollarSign, User, Layout } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contact {
    id: string;
    name: string;
}

interface DealModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const DealModal: React.FC<DealModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [formData, setFormData] = useState({
        contact_id: '',
        title: '',
        value: 0,
        stage: 'Novos Leads'
    });

    useEffect(() => {
        if (isOpen) {
            fetchContacts();
        }
    }, [isOpen]);

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

            const { error } = await supabase
                .from('deals')
                .insert([
                    {
                        ...formData,
                        user_id: user.id,
                        created_at: new Date().toISOString()
                    }
                ]);

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({
                contact_id: '',
                title: '',
                value: 0,
                stage: 'Novos Leads'
            });
        } catch (error) {
            console.error('Error adding deal:', error);
            alert('Erro ao adicionar negócio');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-retro-surface border-4 border-black shadow-pixel w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <div className="bg-retro-bg border-b-4 border-black p-4 flex justify-between items-center">
                    <h2 className="font-header text-xl text-retro-fg uppercase">Novo Negócio</h2>
                    <button onClick={onClose} className="text-retro-comment hover:text-retro-red transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Título do Negócio</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={18} className="text-retro-comment" />
                            </div>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                placeholder="Ex: Projeto Website"
                                required
                                autoComplete="off"
                            />
                        </div>
                    </div>

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

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Valor</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign size={18} className="text-retro-comment" />
                                </div>
                                <input
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                                    className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm uppercase tracking-wider text-retro-comment">Estágio</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Layout size={18} className="text-retro-comment" />
                                </div>
                                <select
                                    value={formData.stage}
                                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg appearance-none"
                                >
                                    <option value="Novos Leads">Novos Leads</option>
                                    <option value="Contatado">Contatado</option>
                                    <option value="Qualificado">Qualificado</option>
                                    <option value="Proposta">Proposta</option>
                                    <option value="Negociação">Negociação</option>
                                    <option value="Fechado">Fechado</option>
                                </select>
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

export default DealModal;
