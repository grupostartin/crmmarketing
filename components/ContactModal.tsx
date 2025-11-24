import React, { useState } from 'react';
import { X, User, Mail, Phone, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'Lead',
        score: 0
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) throw new Error('Usuário não autenticado');

            const { error } = await supabase
                .from('contacts')
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
            setFormData({ name: '', email: '', phone: '', status: 'Lead', score: 0 });
        } catch (error) {
            console.error('Error adding contact:', error);
            alert('Erro ao adicionar contato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-retro-surface border-4 border-black shadow-pixel w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-retro-bg border-b-4 border-black p-4 flex justify-between items-center">
                    <h2 className="font-header text-xl text-retro-fg uppercase">Novo Contato</h2>
                    <button onClick={onClose} className="text-retro-comment hover:text-retro-red transition-colors">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4" autoComplete="off">
                    {/* Hidden inputs to trick browser autocomplete */}
                    <input autoComplete="false" name="hidden" type="text" style={{ display: 'none' }} />

                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Nome</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <User size={18} className="text-retro-comment" />
                            </div>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                placeholder="Nome do contato"
                                required
                                autoComplete="new-password"
                                name="contact_name_field_random"
                                data-lpignore="true"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Email</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Mail size={18} className="text-retro-comment" />
                            </div>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                placeholder="email@exemplo.com"
                                autoComplete="new-password"
                                name="contact_email_field_random"
                                data-lpignore="true"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Telefone</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone size={18} className="text-retro-comment" />
                            </div>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg pl-10 pr-3 py-2 outline-none font-body text-lg"
                                placeholder="(00) 00000-0000"
                                autoComplete="new-password"
                                name="contact_phone_field_random"
                                data-lpignore="true"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm uppercase tracking-wider text-retro-comment">Status Inicial</label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full bg-retro-bg border-2 border-black focus:border-retro-cyan text-retro-fg px-3 py-2 outline-none font-body text-lg"
                        >
                            <option value="Lead">Lead (Frio)</option>
                            <option value="Morno">Morno</option>
                            <option value="Quente">Quente</option>
                        </select>
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

export default ContactModal;
