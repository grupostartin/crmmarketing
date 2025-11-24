import React, { useEffect, useState } from 'react';
import PixelButton from '../components/ui/PixelButton';
import { Filter, Download, Mail, Phone, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ContactModal from '../components/ContactModal';

interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    score: number;
    status: string;
    created_at: string;
}

const Contacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchContacts = async () => {
        try {
            setLoading(true);
            // RLS policies automatically filter by user_id
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (error) {
            console.error('Error fetching contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR');
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-header text-3xl text-retro-fg">Contatos</h1>
                    <p className="text-retro-comment text-lg">Visualize e gerencie seus leads.</p>
                </div>
                <PixelButton variant="primary" onClick={() => setIsModalOpen(true)}>+ Adicionar Contato</PixelButton>
            </div>

            {/* Filter Bar */}
            <div className="bg-retro-surface border-4 border-black p-4 shadow-pixel flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar contatos..."
                            className="w-full bg-retro-bg border-2 border-black px-4 py-2 text-lg focus:border-retro-cyan outline-none"
                        />
                    </div>
                    <PixelButton variant="secondary" className="flex items-center gap-2">
                        <Filter size={16} /> Filtrar
                    </PixelButton>
                </div>
                <div className="flex gap-2">
                    <PixelButton variant="secondary" className="flex items-center gap-2">
                        <Download size={16} /> Exportar
                    </PixelButton>
                </div>
            </div>

            {/* Contact Grid */}
            {loading ? (
                <div className="text-center py-10 text-retro-comment animate-pulse">Carregando contatos...</div>
            ) : contacts.length === 0 ? (
                <div className="text-center py-20 border-4 border-dashed border-retro-comment/30 rounded-lg">
                    <p className="text-retro-comment text-xl mb-4">Nenhum contato encontrado.</p>
                    <PixelButton variant="primary" onClick={() => setIsModalOpen(true)}>Adicionar o primeiro</PixelButton>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {contacts.map((contact) => (
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
                                    <div className={`
                                w-10 h-10 flex items-center justify-center border-2 border-black font-bold text-lg shadow-pixel-sm
                                ${contact.status === 'Quente' ? 'bg-retro-red text-black' :
                                            contact.status === 'Morno' ? 'bg-retro-yellow text-black' : 'bg-retro-cyan text-black'}
                            `}>
                                        {contact.score}
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
                                    <button className="flex-1 text-center hover:text-retro-cyan transition-colors font-header text-xs uppercase">Ver Perfil</button>
                                    <div className="w-1 bg-black self-stretch"></div>
                                    <button className="flex-1 text-center hover:text-retro-pink transition-colors font-header text-xs uppercase">Registrar Atividade</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ContactModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchContacts}
            />
        </div>
    );
};

export default Contacts;