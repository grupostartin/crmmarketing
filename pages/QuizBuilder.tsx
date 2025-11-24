import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PixelCard from '../components/ui/PixelCard';
import PixelButton from '../components/ui/PixelButton';
import QuizResponses from '../components/QuizResponses';
import { Plus, Trash2, GripVertical, Eye, Share2, Save, Link as LinkIcon, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Quiz {
    id: string;
    title: string;
    description: string;
    is_published: boolean;
}

interface Question {
    id: string;
    quiz_id: string;
    text: string;
    type: 'multiple_choice' | 'short_text';
    order: number;
    options?: Option[];
}

interface Option {
    id: string;
    question_id: string;
    text: string;
    points: number;
}

interface SortableQuestionItemProps {
    question: Question;
    isActive: boolean;
    onClick: () => void;
}

const SortableQuestionItem = ({ question, isActive, onClick }: SortableQuestionItemProps) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onClick}
            className={`p-3 border-2 cursor-pointer flex items-center gap-3 hover:bg-retro-bg/50 group transition-all ${isActive ? 'bg-retro-cyan/20 border-retro-cyan' : 'bg-retro-surface border-black'}`}
        >
            <div {...attributes} {...listeners}>
                <GripVertical className="text-retro-comment cursor-move" size={16} />
            </div>
            <div className="flex-1 overflow-hidden">
                <p className="font-bold text-lg leading-none mb-1">Q{question.order + 1}</p>
                <p className="text-sm text-retro-comment truncate">{question.text || 'Nova Pergunta'}</p>
            </div>
        </div>
    );
};

const QuizBuilder = () => {
    const navigate = useNavigate();
    const { id: quizId } = useParams();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showResponses, setShowResponses] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    useEffect(() => {
        loadQuiz();
    }, [quizId]);

    const loadQuiz = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let quizData;

            if (quizId) {
                // Carregar quiz existente
                const { data, error } = await supabase
                    .from('quizzes')
                    .select('*')
                    .eq('id', quizId)
                    .eq('user_id', user.id)
                    .single();

                if (error) throw error;
                quizData = data;
            } else {
                // Criar novo quiz
                const { data: newQuiz, error: createError } = await supabase
                    .from('quizzes')
                    .insert([{
                        user_id: user.id,
                        title: 'Meu Novo Quiz',
                        description: '',
                        is_published: false
                    }])
                    .select()
                    .single();

                if (createError) throw createError;
                quizData = newQuiz;

                // Redirecionar para a URL com o ID do novo quiz
                navigate(`/quiz/builder/${newQuiz.id}`, { replace: true });
            }

            setQuiz(quizData);

            // Fetch questions
            const { data: questionsData } = await supabase
                .from('quiz_questions')
                .select('*, options:quiz_options(*)')
                .eq('quiz_id', quizData.id)
                .order('order');

            if (questionsData) {
                setQuestions(questionsData.map((q: any) => ({
                    ...q,
                    options: q.options?.sort((a: any, b: any) => a.text.localeCompare(b.text))
                })));
                if (questionsData.length > 0) {
                    setActiveQuestionId(questionsData[0].id);
                }
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!quiz) return;

        try {
            // Deletar perguntas e opções
            const { data: questions } = await supabase
                .from('quiz_questions')
                .select('id')
                .eq('quiz_id', quiz.id);

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
                .eq('quiz_id', quiz.id);

            // Deletar respostas
            await supabase
                .from('quiz_responses')
                .delete()
                .eq('quiz_id', quiz.id);

            // Deletar quiz
            await supabase
                .from('quizzes')
                .delete()
                .eq('id', quiz.id);

            // Redirecionar para lista
            navigate('/quiz');
        } catch (error) {
            console.error('Error deleting quiz:', error);
            alert('Erro ao deletar quiz.');
        }
    };

    const handleAddQuestion = async () => {
        if (!quiz) return;
        const newOrder = questions.length;
        const { data, error } = await supabase
            .from('quiz_questions')
            .insert([{
                quiz_id: quiz.id,
                text: 'Nova Pergunta',
                type: 'multiple_choice',
                order: newOrder
            }])
            .select()
            .single();

        if (data) {
            setQuestions([...questions, { ...data, options: [] }]);
            setActiveQuestionId(data.id);
        }
    };

    const handleUpdateQuestion = async (id: string, updates: Partial<Question>) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, ...updates } : q));

        // Debounce save would be better, but direct update for now
        await supabase.from('quiz_questions').update(updates).eq('id', id);
    };

    const handleAddOption = async (questionId: string) => {
        const { data } = await supabase
            .from('quiz_options')
            .insert([{
                question_id: questionId,
                text: 'Nova Opção',
                points: 0
            }])
            .select()
            .single();

        if (data) {
            setQuestions(questions.map(q => {
                if (q.id === questionId) {
                    return { ...q, options: [...(q.options || []), data] };
                }
                return q;
            }));
        }
    };

    const handleUpdateOption = async (questionId: string, optionId: string, updates: Partial<Option>) => {
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options?.map(o => o.id === optionId ? { ...o, ...updates } : o)
                };
            }
            return q;
        }));
        await supabase.from('quiz_options').update(updates).eq('id', optionId);
    };

    const handleDeleteOption = async (questionId: string, optionId: string) => {
        await supabase.from('quiz_options').delete().eq('id', optionId);
        setQuestions(questions.map(q => {
            if (q.id === questionId) {
                return {
                    ...q,
                    options: q.options?.filter(o => o.id !== optionId)
                };
            }
            return q;
        }));
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setQuestions((items: Question[]) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newItems = arrayMove(items, oldIndex, newIndex);

                // Update order in DB
                newItems.forEach((item, index) => {
                    if (item.order !== index) {
                        supabase.from('quiz_questions').update({ order: index }).eq('id', item.id).then();
                    }
                    item.order = index;
                });

                return newItems;
            });
        }
    };

    const handleSaveQuiz = async () => {
        if (!quiz) return;
        setSaving(true);
        try {
            await supabase.from('quizzes').update({
                title: quiz.title,
                description: quiz.description,
                is_published: true  // Auto-publicar
            }).eq('id', quiz.id);

            // Redirecionar para lista de quizzes
            navigate('/quiz');
        } catch (error) {
            console.error(error);
            alert('Erro ao salvar quiz.');
            setSaving(false);
        }
    };

    const activeQuestion = questions.find(q => q.id === activeQuestionId);

    if (loading) return <div className="p-8 text-center text-retro-comment">Carregando Quiz...</div>;

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-8 border-b-4 border-black pb-6 bg-retro-surface -mx-8 px-8 pt-2">
                <div>
                    <h1 className="font-header text-3xl text-retro-fg">Criador de Quiz</h1>
                    <p className="text-retro-comment text-lg">Edite seu quiz e compartilhe.</p>
                </div>
                <div className="flex gap-3">
                    {quiz?.is_published && (
                        <a
                            href={`/quiz/public/${quiz.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-retro-cyan hover:bg-retro-cyan/90 text-black font-header text-sm py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2"
                        >
                            <Eye size={16} />
                            Visualizar
                        </a>
                    )}
                    <button
                        onClick={() => setShowResponses(true)}
                        className="bg-retro-purple hover:bg-retro-purple/90 text-white font-header text-sm py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2"
                    >
                        <Users size={16} />
                        Ver Respostas
                    </button>
                    <button
                        onClick={() => setDeleteConfirm(true)}
                        className="bg-retro-red hover:bg-retro-red/90 text-white font-header text-sm py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2"
                        title="Deletar quiz"
                    >
                        <Trash2 size={16} />
                        Deletar
                    </button>
                    <button
                        onClick={handleSaveQuiz}
                        disabled={saving}
                        className="bg-retro-green hover:bg-retro-green/90 text-black font-header text-sm py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={16} />
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                </div>
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Sidebar Questions List */}
                <div className="w-80 flex flex-col gap-4 overflow-y-auto pr-2">
                    <div className="bg-retro-surface border-2 border-black p-4">
                        <label className="text-retro-comment text-sm uppercase block mb-2">Título do Quiz</label>
                        <input
                            type="text"
                            value={quiz?.title || ''}
                            onChange={(e) => setQuiz(quiz ? { ...quiz, title: e.target.value } : null)}
                            className="w-full bg-retro-bg border-2 border-retro-comment p-2 text-retro-fg font-body text-lg focus:border-retro-cyan outline-none"
                        />
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={questions.map(q => q.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3">
                                {questions.map((q) => (
                                    <SortableQuestionItem
                                        question={q}
                                        isActive={activeQuestionId === q.id}
                                        onClick={() => setActiveQuestionId(q.id)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    <button
                        onClick={handleAddQuestion}
                        className="w-full py-3 border-2 border-dashed border-retro-comment text-retro-comment hover:border-retro-green hover:text-retro-green transition-colors font-header text-xs uppercase flex items-center justify-center gap-2"
                    >
                        <Plus size={16} /> Adicionar Pergunta
                    </button>
                </div>

                {/* Main Editor Area */}
                <div className="flex-1 overflow-y-auto">
                    {activeQuestion ? (
                        <div className="max-w-3xl mx-auto space-y-8 pb-20">
                            <PixelCard title={`Configuração da Pergunta ${activeQuestion.order + 1}`}>
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-retro-comment mb-2 uppercase text-sm font-header">Tipo de Pergunta</label>
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => handleUpdateQuestion(activeQuestion.id, { type: 'multiple_choice' })}
                                                className={`flex-1 py-3 border-2 font-bold shadow-pixel-sm ${activeQuestion.type === 'multiple_choice' ? 'border-retro-cyan bg-retro-cyan/20 text-retro-cyan' : 'border-retro-comment text-retro-comment hover:border-retro-fg'}`}
                                            >
                                                Múltipla Escolha
                                            </button>
                                            <button
                                                onClick={() => handleUpdateQuestion(activeQuestion.id, { type: 'short_text' })}
                                                className={`flex-1 py-3 border-2 font-bold shadow-pixel-sm ${activeQuestion.type === 'short_text' ? 'border-retro-cyan bg-retro-cyan/20 text-retro-cyan' : 'border-retro-comment text-retro-comment hover:border-retro-fg'}`}
                                            >
                                                Texto Curto
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-retro-comment mb-2 uppercase text-sm font-header">Texto da Pergunta</label>
                                        <input
                                            type="text"
                                            value={activeQuestion.text}
                                            onChange={(e) => handleUpdateQuestion(activeQuestion.id, { text: e.target.value })}
                                            className="w-full bg-retro-bg border-2 border-black p-4 text-xl text-retro-fg focus:border-retro-cyan outline-none shadow-pixel-sm"
                                        />
                                    </div>
                                </div>
                            </PixelCard>

                            {activeQuestion.type === 'multiple_choice' && (
                                <PixelCard title="Respostas & Pontuação">
                                    <div className="space-y-3">
                                        {activeQuestion.options?.map((opt, i) => (
                                            <div key={opt.id} className="flex gap-3 items-center">
                                                <div className="w-8 h-8 flex items-center justify-center font-bold bg-retro-surface border-2 border-black">
                                                    {String.fromCharCode(65 + i)}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={opt.text}
                                                    onChange={(e) => handleUpdateOption(activeQuestion.id, opt.id, { text: e.target.value })}
                                                    className="flex-1 bg-retro-bg border-2 border-black p-2 text-lg focus:border-retro-pink outline-none"
                                                />
                                                <div className="flex items-center gap-2 px-3 py-2 bg-retro-bg border-2 border-black">
                                                    <span className="text-retro-comment text-sm">Pts:</span>
                                                    <input
                                                        type="number"
                                                        value={opt.points}
                                                        onChange={(e) => handleUpdateOption(activeQuestion.id, opt.id, { points: parseInt(e.target.value) || 0 })}
                                                        className="w-12 bg-transparent text-center outline-none font-bold text-retro-green"
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteOption(activeQuestion.id, opt.id)}
                                                    className="p-2 text-retro-red hover:bg-retro-red hover:text-black border-2 border-transparent hover:border-black transition-colors"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => handleAddOption(activeQuestion.id)}
                                            className="text-retro-cyan hover:underline mt-2 text-sm font-header uppercase"
                                        >
                                            + Adicionar Opção
                                        </button>
                                    </div>
                                </PixelCard>
                            )}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-full text-retro-comment">
                            Selecione ou crie uma pergunta para editar.
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Responses Modal */}
            {showResponses && quiz && (
                <QuizResponses
                    quizId={quiz.id}
                    isOpen={showResponses}
                    onClose={() => setShowResponses(false)}
                />
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
                                onClick={handleDeleteQuiz}
                                className="flex-1 bg-retro-red hover:bg-retro-red/90 text-white font-bold py-2 px-4 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase"
                            >
                                Deletar
                            </button>
                            <button
                                onClick={() => setDeleteConfirm(false)}
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

export default QuizBuilder;