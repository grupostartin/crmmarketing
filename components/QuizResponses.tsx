import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { X, ExternalLink, Trash2 } from 'lucide-react';

interface Response {
    id: string;
    respondent_name: string;
    respondent_email: string;
    respondent_whatsapp?: string;
    total_score: number;
    created_at: string;
    contact_id?: string;
}

interface QuizResponsesProps {
    quizId: string;
    isOpen: boolean;
    onClose: () => void;
}

const QuizResponses: React.FC<QuizResponsesProps> = ({ quizId, isOpen, onClose }) => {
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            fetchResponses();
        }
    }, [quizId, isOpen]);

    const fetchResponses = async () => {
        try {
            const { data, error } = await supabase
                .from('quiz_responses')
                .select('*')
                .eq('quiz_id', quizId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setResponses(data || []);
        } catch (error) {
            console.error('Error loading responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (responseId: string) => {
        try {
            const { error: answersError } = await supabase
                .from('quiz_answers')
                .delete()
                .eq('response_id', responseId);

            if (answersError) throw answersError;

            const { error: responseError } = await supabase
                .from('quiz_responses')
                .delete()
                .eq('id', responseId);

            if (responseError) throw responseError;

            setResponses(responses.filter(r => r.id !== responseId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting response:', error);
            alert('Erro ao deletar resposta.');
        }
    };

    const getTemperature = (score: number) => {
        if (score >= 61) return { label: 'QUENTE', color: 'text-retro-red', bg: 'bg-retro-red' };
        if (score >= 31) return { label: 'MORNO', color: 'text-retro-yellow', bg: 'bg-retro-yellow' };
        return { label: 'FRIO', color: 'text-retro-cyan', bg: 'bg-retro-cyan' };
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isOpen) return null;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
                <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-4xl w-full mx-4">
                    <p className="text-retro-comment text-center">Carregando respostas...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="bg-retro-bg border-4 border-black shadow-pixel max-w-6xl w-full my-8">
                    <div className="bg-retro-surface border-b-4 border-black p-6 flex justify-between items-center sticky top-0 z-10">
                        <div>
                            <h2 className="font-header text-2xl text-retro-fg">Respostas do Quiz</h2>
                            <p className="text-retro-comment text-sm mt-1">{responses.length} respostas recebidas</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-retro-bg border-2 border-transparent hover:border-black transition-colors"
                        >
                            <X size={24} className="text-retro-fg" />
                        </button>
                    </div>

                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                        {responses.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-retro-comment text-xl">Nenhuma resposta ainda.</p>
                                <p className="text-retro-comment text-sm mt-2">Compartilhe o link do quiz para começar a receber respostas!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {responses.map((response) => {
                                    const temp = getTemperature(response.total_score);
                                    return (
                                        <div
                                            key={response.id}
                                            className="bg-retro-surface border-2 border-black p-4 shadow-pixel-sm hover:shadow-pixel transition-shadow relative"
                                        >
                                            <button
                                                onClick={() => setDeleteConfirm(response.id)}
                                                className="absolute top-2 right-2 p-1 hover:bg-retro-red hover:text-white border-2 border-black transition-colors"
                                                title="Deletar resposta"
                                            >
                                                <Trash2 size={16} />
                                            </button>

                                            <div className="flex justify-between items-start mb-3 pr-8">
                                                <div className="flex-1">
                                                    <h3 className="font-bold text-lg text-retro-fg truncate">
                                                        {response.respondent_name}
                                                    </h3>
                                                    <p className="text-sm text-retro-comment truncate">
                                                        {response.respondent_email}
                                                    </p>
                                                    {response.respondent_whatsapp && (
                                                        <p className="text-sm text-retro-green truncate">
                                                            📱 {response.respondent_whatsapp}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="border-t-2 border-black pt-3 mt-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-retro-comment text-xs uppercase">Pontuação</span>
                                                    <span className={`font-header text-2xl ${temp.color}`}>
                                                        {response.total_score}
                                                    </span>
                                                </div>
                                                <div className={`px-3 py-1 ${temp.bg} text-black font-bold uppercase text-center text-sm border-2 border-black`}>
                                                    Lead {temp.label}
                                                </div>
                                            </div>

                                            <div className="mt-3 pt-3 border-t-2 border-black">
                                                <p className="text-xs text-retro-comment">
                                                    {formatDate(response.created_at)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]">
                    <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-md mx-4">
                        <h3 className="font-header text-xl text-retro-fg mb-4">Confirmar Exclusão</h3>
                        <p className="text-retro-comment mb-6">
                            Tem certeza que deseja deletar esta resposta? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => handleDelete(deleteConfirm)}
                                className="flex-1 bg-retro-red hover:bg-retro-red/90 text-white font-bold py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
                            >
                                Deletar
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="flex-1 bg-retro-surface hover:bg-retro-comment/20 text-retro-fg font-bold py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default QuizResponses;
