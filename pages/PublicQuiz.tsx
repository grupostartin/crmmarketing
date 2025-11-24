import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import PixelButton from '../components/ui/PixelButton';
import PixelCard from '../components/ui/PixelCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Quiz {
    id: string;
    title: string;
    description: string;
    user_id: string;
}

interface Question {
    id: string;
    text: string;
    type: 'multiple_choice' | 'short_text';
    order: number;
    options: Option[];
}

interface Option {
    id: string;
    text: string;
    points: number;
}

const PublicQuiz = () => {
    const { id } = useParams<{ id: string }>();
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [agencyName, setAgencyName] = useState<string>('AgencyFlow');
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentStep, setCurrentStep] = useState(0); // 0 = dados, 1-N = perguntas
    const [respondent, setRespondent] = useState({ name: '', email: '', whatsapp: '' });
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        if (id) loadQuiz(id);
    }, [id]);

    const loadQuiz = async (quizId: string) => {
        try {
            const { data: quizData, error } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .eq('is_published', true)
                .single();

            if (error || !quizData) {
                setLoading(false);
                return;
            }

            setQuiz(quizData);
            
            // Buscar nome da agência
            if (quizData.agency_id) {
                const { data: agencyData } = await supabase
                    .from('agencies')
                    .select('name')
                    .eq('id', quizData.agency_id)
                    .single();
                if (agencyData) {
                    setAgencyName(agencyData.name);
                }
            }

            const { data: questionsData } = await supabase
                .from('quiz_questions')
                .select('*, options:quiz_options(*)')
                .eq('quiz_id', quizId)
                .order('order');

            if (questionsData) {
                setQuestions(questionsData.map((q: any) => ({
                    ...q,
                    options: q.options?.sort((a: any, b: any) => a.text.localeCompare(b.text))
                })));
            }
        } catch (error) {
            console.error('Error loading quiz:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (questionId: string, optionId: string, points: number) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { optionId, points }
        }));
    };

    const handleTextChange = (questionId: string, text: string) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: { text }
        }));
    };

    const canGoNext = () => {
        if (currentStep === 0) {
            return respondent.name && respondent.email && respondent.whatsapp;
        } else if (currentStep <= questions.length) {
            const currentQuestion = questions[currentStep - 1];
            return !!answers[currentQuestion.id];
        }
        return false;
    };

    const handleNext = () => {
        if (!canGoNext()) {
            alert('Por favor, preencha todos os campos antes de continuar.');
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        if (!quiz) return;

        let totalScore = 0;
        Object.values(answers).forEach((ans: any) => {
            if (ans.points) totalScore += ans.points;
        });

        try {
            // Determinar temperatura do lead
            let leadStatus = 'Frio';
            if (totalScore >= 61) leadStatus = 'Quente';
            else if (totalScore >= 31) leadStatus = 'Morno';

            // Buscar agency_id do quiz
            const { data: quizData } = await supabase
                .from('quizzes')
                .select('agency_id')
                .eq('id', quiz.id)
                .single();

            if (!quizData?.agency_id) {
                throw new Error('Quiz não está associado a uma agência');
            }

            // 1. Criar contato
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .insert([{
                    name: respondent.name,
                    email: respondent.email,
                    phone: respondent.whatsapp,
                    status: leadStatus,
                    score: totalScore,
                    agency_id: quizData.agency_id,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (contactError) throw contactError;

            // 2. Criar deal no pipeline
            const { error: dealError } = await supabase
                .from('deals')
                .insert([{
                    title: `${respondent.name} - Quiz: ${quiz.title}`,
                    contact_id: contact.id,
                    user_id: quiz.user_id,
                    agency_id: quizData.agency_id,
                    value: 0,
                    stage: 'Novos Leads',
                    created_at: new Date().toISOString()
                }]);

            if (dealError) throw dealError;

            // 3. Criar resposta do quiz
            const { data: response, error: responseError } = await supabase
                .from('quiz_responses')
                .insert([{
                    quiz_id: quiz.id,
                    contact_id: contact.id,
                    agency_id: quizData.agency_id,
                    respondent_name: respondent.name,
                    respondent_email: respondent.email,
                    respondent_whatsapp: respondent.whatsapp,
                    total_score: totalScore,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (responseError) throw responseError;

            // 4. Criar respostas individuais
            const answersToInsert = Object.entries(answers).map(([questionId, ans]: [string, any]) => ({
                response_id: response.id,
                question_id: questionId,
                option_id: ans.optionId || null,
                text_value: ans.text || null
            }));

            if (answersToInsert.length > 0) {
                await supabase.from('quiz_answers').insert(answersToInsert);
            }

            setSubmitted(true);
        } catch (error) {
            console.error('Error submitting quiz:', error);
            alert('Erro ao enviar respostas.');
        }
    };

    if (loading) return <div className="min-h-screen bg-retro-bg flex items-center justify-center text-retro-fg font-header">Carregando...</div>;
    if (!quiz) return <div className="min-h-screen bg-retro-bg flex items-center justify-center text-retro-fg font-header">Quiz não encontrado ou não publicado.</div>;

    if (submitted) {
        return (
            <div className="min-h-screen bg-retro-bg p-8 flex items-center justify-center">
                <div className="max-w-2xl w-full">
                    <PixelCard title="Obrigado!">
                        <div className="text-center space-y-6 py-8">
                            <h2 className="font-header text-3xl text-retro-green mb-6">✓ Respostas Enviadas!</h2>

                            <div className="bg-retro-surface border-2 border-black p-6">
                                <p className="text-retro-fg text-lg leading-relaxed">
                                    Nossa equipe está analisando as suas respostas e em breve entrará em contato.
                                </p>
                                <p className="text-retro-fg text-lg leading-relaxed mt-4">
                                    Obrigado por entrar em contato com a <strong className="text-retro-cyan">{agencyName}</strong>!
                                </p>
                            </div>
                        </div>
                    </PixelCard>
                </div>
            </div>
        );
    }

    const totalSteps = questions.length + 1; // +1 para dados pessoais
    const currentQuestion = currentStep > 0 ? questions[currentStep - 1] : null;

    return (
        <div className="min-h-screen bg-retro-bg p-4 md:p-8 flex items-center justify-center">
            <div className="max-w-2xl w-full space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="font-header text-4xl text-retro-fg mb-2">{quiz.title}</h1>
                    <p className="text-retro-comment text-lg">{quiz.description || 'Responda as perguntas abaixo'}</p>
                </div>

                {/* Progress Indicator */}
                <div className="bg-retro-surface border-4 border-black p-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-retro-comment text-sm font-bold">
                            {currentStep === 0 ? 'DADOS PESSOAIS' : `PERGUNTA ${currentStep} DE ${questions.length}`}
                        </span>
                        <span className="text-retro-cyan text-sm font-bold">
                            {Math.round((currentStep / totalSteps) * 100)}%
                        </span>
                    </div>
                    <div className="w-full bg-retro-bg border-2 border-black h-4">
                        <div
                            className="bg-retro-cyan h-full transition-all duration-300"
                            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <PixelCard title={currentStep === 0 ? 'Seus Dados' : `Pergunta ${currentStep}`}>
                    {currentStep === 0 ? (
                        // Step 0: Dados Pessoais
                        <div className="space-y-4">
                            <div>
                                <label className="block text-retro-comment uppercase text-sm font-bold mb-2">Nome Completo</label>
                                <input
                                    type="text"
                                    value={respondent.name}
                                    onChange={e => setRespondent({ ...respondent, name: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                                    placeholder="Digite seu nome"
                                />
                            </div>
                            <div>
                                <label className="block text-retro-comment uppercase text-sm font-bold mb-2">Email</label>
                                <input
                                    type="email"
                                    value={respondent.email}
                                    onChange={e => setRespondent({ ...respondent, email: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                                    placeholder="seu@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-retro-comment uppercase text-sm font-bold mb-2">WhatsApp</label>
                                <input
                                    type="tel"
                                    value={respondent.whatsapp}
                                    onChange={e => setRespondent({ ...respondent, whatsapp: e.target.value })}
                                    className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                                    placeholder="(11) 99999-9999"
                                />
                            </div>
                        </div>
                    ) : currentQuestion ? (
                        // Steps 1-N: Perguntas
                        <div className="space-y-4">
                            <h3 className="text-retro-fg text-xl font-bold mb-4">{currentQuestion.text}</h3>

                            {currentQuestion.type === 'multiple_choice' ? (
                                <div className="space-y-3">
                                    {currentQuestion.options?.map((opt) => (
                                        <label
                                            key={opt.id}
                                            className={`flex items-center gap-4 p-4 border-2 cursor-pointer transition-all ${answers[currentQuestion.id]?.optionId === opt.id
                                                    ? 'bg-retro-cyan/20 border-retro-cyan'
                                                    : 'bg-retro-bg border-black hover:bg-retro-surface'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={currentQuestion.id}
                                                value={opt.id}
                                                checked={answers[currentQuestion.id]?.optionId === opt.id}
                                                onChange={() => handleOptionSelect(currentQuestion.id, opt.id, opt.points)}
                                                className="w-5 h-5 accent-retro-cyan"
                                            />
                                            <span className="text-lg text-retro-fg">{opt.text}</span>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <textarea
                                    rows={4}
                                    value={answers[currentQuestion.id]?.text || ''}
                                    onChange={(e) => handleTextChange(currentQuestion.id, e.target.value)}
                                    className="w-full bg-retro-bg border-2 border-black p-4 text-retro-fg focus:border-retro-cyan outline-none resize-none"
                                    placeholder="Digite sua resposta..."
                                />
                            )}
                        </div>
                    ) : null}
                </PixelCard>

                {/* Navigation Buttons */}
                <div className="flex justify-between gap-4">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                        className="bg-retro-surface hover:bg-retro-comment/20 text-retro-fg font-header text-sm py-3 px-6 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                        Anterior
                    </button>

                    {currentStep < questions.length ? (
                        <button
                            onClick={handleNext}
                            disabled={!canGoNext()}
                            className="bg-retro-cyan hover:bg-retro-cyan/90 text-black font-header text-sm py-3 px-6 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Próximo
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleSubmit}
                            disabled={!canGoNext()}
                            className="bg-retro-green hover:bg-retro-green/90 text-black font-header text-sm py-3 px-8 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Enviar Respostas
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicQuiz;
