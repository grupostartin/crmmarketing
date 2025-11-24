import React, { useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import PixelButton from './ui/PixelButton';
import { useAgency } from '../context/AgencyContext';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    contactId: string;
    onSuccess: () => void;
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, contactId, onSuccess }) => {
    const { agency } = useAgency();
    const [loading, setLoading] = useState(false);
    const getSPDate = () => {
        return new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T').slice(0, 16);
    };

    const [formData, setFormData] = useState({
        type: 'Call',
        title: '',
        description: '',
        activity_date: getSPDate(),
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            if (!agency) {
                throw new Error('Você precisa estar associado a uma agência para registrar atividades');
            }

            const { error } = await supabase
                .from('activities')
                .insert([
                    {
                        contact_id: contactId,
                        user_id: user.id,
                        agency_id: agency.id,
                        type: formData.type,
                        title: formData.title,
                        description: formData.description || null,
                        activity_date: new Date(formData.activity_date).toISOString(),
                    }
                ]);

            if (error) throw error;

            onSuccess();
            onClose();
            setFormData({
                type: 'Call',
                title: '',
                description: '',
                activity_date: getSPDate(),
            });
        } catch (error) {
            console.error('Erro ao registrar atividade:', error);
            alert('Erro ao registrar atividade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-retro-bg border-4 border-black shadow-pixel max-w-md w-full">
                <div className="border-b-4 border-black p-4 flex justify-between items-center">
                    <h2 className="font-header text-xl text-retro-fg">Registrar Atividade</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-retro-surface border-2 border-black transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-retro-fg mb-2 font-bold">Tipo de Atividade</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-retro-surface border-2 border-black px-4 py-2 focus:border-retro-cyan outline-none"
                            required
                        >
                            <option value="Call">📞 Ligação</option>
                            <option value="Email">📧 Email</option>
                            <option value="Meeting">🤝 Reunião</option>
                            <option value="Note">📝 Nota</option>
                            <option value="Task">✅ Tarefa</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-retro-fg mb-2 font-bold">Título</label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full bg-retro-surface border-2 border-black px-4 py-2 focus:border-retro-cyan outline-none"
                            placeholder="Ex: Ligação de follow-up"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-retro-fg mb-2 font-bold">Descrição</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-retro-surface border-2 border-black px-4 py-2 focus:border-retro-cyan outline-none resize-none"
                            rows={4}
                            placeholder="Detalhes da atividade..."
                        />
                    </div>

                    <div>
                        <label className="block text-retro-fg mb-2 font-bold">Data e Hora</label>
                        <input
                            type="datetime-local"
                            value={formData.activity_date}
                            onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
                            className="w-full bg-retro-surface border-2 border-black px-4 py-2 focus:border-retro-cyan outline-none"
                            required
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <PixelButton
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            className="flex-1"
                        >
                            Cancelar
                        </PixelButton>
                        <PixelButton
                            type="submit"
                            variant="primary"
                            className="flex-1"
                            disabled={loading}
                        >
                            {loading ? 'Salvando...' : 'Registrar'}
                        </PixelButton>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ActivityModal;

