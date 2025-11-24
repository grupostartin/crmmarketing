import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Plus, FileQuestion, Users, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    description: string | null;
    is_published: boolean;
    created_at: string;
    question_count?: number;
    response_count?: number;
}

const QuizList = () => {
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const fetchQuizzes = async () => {
        try {
            // RLS já filtra por agency_id automaticamente
            // Não precisamos filtrar por user_id
            const { data: quizzesData, error: quizzesError } = await supabase
                .from('quizzes')
                .select('*')
                .order('created_at', { ascending: false });

            if (quizzesError) throw quizzesError;

            // Para cada quiz, buscar contagem de perguntas e respostas
            const quizzesWithCounts = await Promise.all(
                (quizzesData || []).map(async (quiz) => {
                    const [questionsResult, responsesResult] = await Promise.all([
                        supabase
                            .from('quiz_questions')
                            .select('id', { count: 'exact', head: true })
                            .eq('quiz_id', quiz.id),
                        supabase
                            .from('quiz_responses')
                            .select('id', { count: 'exact', head: true })
                            .eq('quiz_id', quiz.id)
                    ]);

                    return {
                        ...quiz,
                        question_count: questionsResult.count || 0,
                        response_count: responsesResult.count || 0
                    };
                })
            );

            setQuizzes(quizzesWithCounts);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (quizId: string) => {
        try {
            // Deletar perguntas e opções primeiro
            const { data: questions } = await supabase
                .from('quiz_questions')
                .select('id')
                .eq('quiz_id', quizId);

            if (questions) {
                for (const question of questions) {
                    await supabase
                        .from('quiz_options')
                        .delete()
                        .eq('question_id', question.id);
                }
            }

            // Deletar perguntas
            await supabase
                .from('quiz_questions')
                .delete()
                .eq('quiz_id', quizId);

            // Deletar respostas
            await supabase
                .from('quiz_responses')
                .delete()
                .eq('quiz_id', quizId);

            // Deletar quiz
            await supabase
                .from('quizzes')
                .delete()
                .eq('id', quizId);

            // Atualizar lista
            setQuizzes(quizzes.filter(q => q.id !== quizId));
            setDeleteConfirm(null);
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Erro ao deletar quiz.');
        }
    };

    const handleCreateNew = () => {
        navigate('/quiz/builder');
    };

    const handleEditQuiz = (quizId: string) => {
        navigate(`/quiz/builder/${quizId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-retro-comment text-xl">Carregando quizzes...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="font-header text-3xl text-retro-fg">Quizzes</h1>
                    <p className="text-retro-comment text-lg">Gerencie seus quizzes de qualificação de leads</p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="bg-retro-green hover:bg-retro-green/90 text-black font-header text-sm py-3 px-6 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2"
                >
                    <Plus size={20} />
                    Criar Novo Quiz
                </button>
            </div>

            {quizzes.length === 0 ? (
                <div className="bg-retro-surface border-4 border-black p-12 shadow-pixel text-center">
                    <FileQuestion size={64} className="mx-auto text-retro-comment mb-4" />
                    <h2 className="font-header text-2xl text-retro-fg mb-2">Nenhum quiz criado ainda</h2>
                    <p className="text-retro-comment mb-6">
                        Crie seu primeiro quiz para começar a qualificar leads automaticamente!
                    </p>
                    <button
                        onClick={handleCreateNew}
                        className="bg-retro-cyan hover:bg-retro-cyan/90 text-black font-header text-sm py-2 px-6 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
                    >
                        Criar Primeiro Quiz
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div
                            key={quiz.id}
                            className="bg-retro-surface border-4 border-black p-6 shadow-pixel hover:shadow-pixel-lg transition-all group relative"
                        >
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirm(quiz.id);
                                }}
                                className="absolute top-4 right-4 p-2 hover:bg-retro-red hover:text-white border-2 border-black transition-colors z-10"
                                title="Deletar quiz"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div onClick={() => handleEditQuiz(quiz.id)} className="cursor-pointer">
                                <div className="flex justify-between items-start mb-4 pr-10">
                                    <h3 className="font-header text-xl text-retro-fg group-hover:text-retro-cyan transition-colors">
                                        {quiz.title}
                                    </h3>
                                    {quiz.is_published ? (
                                        <CheckCircle size={24} className="text-retro-green flex-shrink-0" title="Publicado" />
                                    ) : (
                                        <XCircle size={24} className="text-retro-comment flex-shrink-0" title="Rascunho" />
                                    )}
                                </div>

                                {quiz.description && (
                                    <p className="text-retro-comment text-sm mb-4 line-clamp-2">
                                        {quiz.description}
                                    </p>
                                )}

                                <div className="border-t-2 border-black pt-4 mt-4 grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-2">
                                        <FileQuestion size={16} className="text-retro-yellow" />
                                        <span className="text-retro-fg text-sm">
                                            {quiz.question_count} {quiz.question_count === 1 ? 'pergunta' : 'perguntas'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users size={16} className="text-retro-pink" />
                                        <span className="text-retro-fg text-sm">
                                            {quiz.response_count} {quiz.response_count === 1 ? 'resposta' : 'respostas'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 pt-4 border-t-2 border-black">
                                    <p className="text-xs text-retro-comment">
                                        Criado em {new Date(quiz.created_at).toLocaleDateString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50">
                    <div className="bg-retro-bg border-4 border-black p-8 shadow-pixel max-w-md mx-4">
                        <h3 className="font-header text-xl text-retro-fg mb-4">Confirmar Exclusão</h3>
                        <p className="text-retro-comment mb-6">
                            Tem certeza que deseja deletar este quiz? Todas as perguntas, opções e respostas serão perdidas. Esta ação não pode ser desfeita.
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
        </div>
    );
};

export default QuizList;
