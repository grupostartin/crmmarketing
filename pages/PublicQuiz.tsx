import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle, AlertCircle, ArrowRight, ArrowLeft, Send } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';
import Confetti from 'react-confetti';

interface Question {
    id: string;
    text: string;
    type: 'text' | 'multiple_choice' | 'rating';
    options?: { id: string; text: string }[];
}

interface QuizData {
    id: string;
    title: string;
    description: string;
    agency_id: string;
}

const PublicQuiz = () => {
    const { id } = useParams<{ id: string }>();
    const [quiz, setQuiz] = useState<QuizData | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [leadInfo, setLeadInfo] = useState({ name: '', email: '', phone: '' });
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agencyName, setAgencyName] = useState<string>('');
    const [showConfetti, setShowConfetti] = useState(false);
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [showWatermark, setShowWatermark] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setWindowSize({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (id) {
            fetchQuizData();
        }
    }, [id]);

    const fetchQuizData = async () => {
        try {
            setLoading(true);
            // Buscar dados do quiz
            const { data: quizData, error: quizError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', id)
                .single();

            if (quizError) throw quizError;
            setQuiz(quizData);

            // Buscar nome da agência e plano
            if (quizData.agency_id) {
                const { data: agencyData } = await supabase
                    .from('agencies')
                    .select('name, subscription_tier')
                    .eq('id', quizData.agency_id)
                    .single();
                if (agencyData) {
                    setAgencyName(agencyData.name);
                    // Mostrar marca d'água se for plano free
                    if (agencyData.subscription_tier === 'free') {
                        setShowWatermark(true);
                    }
                }
            }

            // Buscar perguntas e opções
            const { data: questionsData, error: questionsError } = await supabase
                .from('quiz_questions')
                .select(`
                    *,
                    quiz_options (id, text)
                `)
                .eq('quiz_id', id)
                .order('order', { ascending: true });

            if (questionsError) throw questionsError;

            const formattedQuestions = questionsData.map((q: any) => ({
                id: q.id,
                text: q.text,
                type: q.type,
                options: q.quiz_options
            }));

            setQuestions(formattedQuestions);
        } catch (err: any) {
            console.error('Error fetching quiz:', err);
            setError('Não foi possível carregar o quiz. Verifique o link e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (value: any) => {
        const currentQuestion = questions[currentStep - 1]; // -1 porque o passo 0 é o lead info
        if (currentQuestion) {
            setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
        }
    };

    const handleNext = () => {
        // Validação do passo atual
        if (currentStep === 0) {
            if (!leadInfo.name || !leadInfo.email) {
                alert('Por favor, preencha nome e email para continuar.');
                return;
            }
        } else {
            const currentQuestion = questions[currentStep - 1];
            if (!answers[currentQuestion.id]) {
                alert('Por favor, responda a pergunta para continuar.');
                return;
            }
        }

        if (currentStep < questions.length) {
            setCurrentStep(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            // 1. Criar ou atualizar contato
            // Primeiro verificamos se já existe pelo email
            const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('email', leadInfo.email)
                .eq('agency_id', quiz?.agency_id)
                .single();

            let contactId = existingContact?.id;

            if (!contactId) {
                const { data: newContact, error: contactError } = await supabase
                    .from('contacts')
                    .insert({
                        name: leadInfo.name,
                        email: leadInfo.email,
                        phone: leadInfo.phone,
                        agency_id: quiz?.agency_id,
                        status: 'Lead',
                        source: 'Quiz'
                    })
                    .select()
                    .single();

                if (contactError) throw contactError;
                contactId = newContact.id;
            }

            // 2. Salvar resposta do quiz
            const { data: response, error: responseError } = await supabase
                .from('quiz_responses')
                .insert({
                    quiz_id: quiz?.id,
                    contact_id: contactId,
                    score: 0 // Calcularemos depois se necessário
                })
                .select()
                .single();

            if (responseError) throw responseError;

            // 3. Salvar respostas individuais
            const answersToInsert = Object.entries(answers).map(([questionId, value]) => ({
                response_id: response.id,
                question_id: questionId,
                text_answer: typeof value === 'string' ? value : JSON.stringify(value)
            }));

            const { error: answersError } = await supabase
                .from('quiz_answers')
                .insert(answersToInsert);

            if (answersError) throw answersError;

            setCompleted(true);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 5000);

        } catch (err: any) {
            console.error('Error submitting quiz:', err);
            alert('Erro ao enviar respostas. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
            </div>
        );
    }

    if (error || !quiz) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
                <div className="bg-retro-surface border-4 border-black p-8 max-w-md w-full text-center shadow-pixel">
                    <AlertCircle size={48} className="mx-auto text-retro-red mb-4" />
                    <h1 className="font-header text-2xl mb-2">Ops! Algo deu errado</h1>
                    <p className="text-retro-comment">{error || 'Quiz não encontrado'}</p>
                </div>
            </div>
        );
    }

    if (completed) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
                {showConfetti && <Confetti width={windowSize.width} height={windowSize.height} />}
                <div className="bg-retro-surface border-4 border-black p-8 max-w-md w-full text-center shadow-pixel animate-bounce-in relative">
                    <div className="w-20 h-20 bg-retro-green rounded-full border-4 border-black flex items-center justify-center mx-auto mb-6 -mt-16 shadow-pixel">
                        <CheckCircle size={40} className="text-black" />
                    </div>
                    <h1 className="font-header text-3xl mb-4">Obrigado!</h1>
                    <p className="text-lg mb-6">
                        Suas respostas foram enviadas com sucesso. Entraremos em contato em breve.
                    </p>
                    <div className="border-t-2 border-black pt-4 mt-4">
                        <p className="text-sm text-retro-comment font-bold uppercase">
                            {agencyName}
                        </p>
                    </div>
                    {showWatermark && (
                        <div className="fixed bottom-2 right-2 animate-pulse z-50">
                            <a href="/lp" target="_blank" rel="noopener noreferrer" className="bg-white/90 px-4 py-2 rounded border-2 border-black/20 text-xs font-bold uppercase text-retro-comment flex items-center gap-2 shadow-sm">
                                Powered by <span className="text-black text-sm">CRM Marketing</span>
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Progress bar calculation
    const totalSteps = questions.length + 1; // +1 for lead info
    const progress = ((currentStep + 1) / totalSteps) * 100;

    return (
        <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center p-4 relative">
            <div className="w-full max-w-2xl">
                {/* Header with Agency Name */}
                <div className="text-center mb-8">
                    <h2 className="font-header text-xl text-retro-comment uppercase tracking-widest mb-2">
                        {agencyName}
                    </h2>
                    <h1 className="font-header text-4xl md:text-5xl text-retro-fg mb-4">
                        {quiz.title}
                    </h1>
                    {quiz.description && (
                        <p className="text-lg text-retro-fg/80 max-w-lg mx-auto">
                            {quiz.description}
                        </p>
                    )}
                </div>

                {/* Main Card */}
                <div className="bg-retro-surface border-4 border-black shadow-pixel relative overflow-hidden min-h-[400px] flex flex-col">
                    {/* Progress Bar */}
                    <div className="h-4 border-b-4 border-black bg-retro-bg/50">
                        <div
                            className="h-full bg-retro-cyan transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>

                    <div className="p-8 flex-1 flex flex-col">
                        <div className="flex-1 flex flex-col justify-center">
                            {currentStep === 0 ? (
                                // Step 0: Lead Info
                                <div className="animate-fade-in space-y-6">
                                    <div className="text-center mb-8">
                                        <h3 className="font-header text-2xl mb-2">Vamos começar?</h3>
                                        <p className="text-retro-comment">
                                            Preencha seus dados para iniciar o quiz.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className="block font-bold text-sm uppercase mb-2">Nome Completo</label>
                                            <input
                                                type="text"
                                                value={leadInfo.name}
                                                onChange={e => setLeadInfo({ ...leadInfo, name: e.target.value })}
                                                className="w-full bg-retro-bg border-2 border-black p-4 text-lg focus:border-retro-cyan outline-none transition-colors"
                                                placeholder="Seu nome aqui"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-sm uppercase mb-2">Email</label>
                                            <input
                                                type="email"
                                                value={leadInfo.email}
                                                onChange={e => setLeadInfo({ ...leadInfo, email: e.target.value })}
                                                className="w-full bg-retro-bg border-2 border-black p-4 text-lg focus:border-retro-cyan outline-none transition-colors"
                                                placeholder="seu@email.com"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-sm uppercase mb-2">Telefone (Opcional)</label>
                                            <input
                                                type="tel"
                                                value={leadInfo.phone}
                                                onChange={e => setLeadInfo({ ...leadInfo, phone: e.target.value })}
                                                className="w-full bg-retro-bg border-2 border-black p-4 text-lg focus:border-retro-cyan outline-none transition-colors"
                                                placeholder="(00) 00000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                // Questions Steps
                                <div className="animate-fade-in">
                                    <span className="inline-block bg-black text-white px-3 py-1 text-xs font-bold uppercase mb-4">
                                        Pergunta {currentStep} de {questions.length}
                                    </span>

                                    <h3 className="font-header text-2xl md:text-3xl mb-8 leading-tight">
                                        {questions[currentStep - 1].text}
                                    </h3>

                                    <div className="space-y-3">
                                        {questions[currentStep - 1].type === 'multiple_choice' && (
                                            questions[currentStep - 1].options?.map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => handleAnswer(option.text)}
                                                    className={`w-full text-left p-4 border-2 border-black transition-all hover:-translate-y-1 hover:shadow-pixel-sm flex items-center gap-3
                                                        ${answers[questions[currentStep - 1].id] === option.text
                                                            ? 'bg-retro-cyan font-bold'
                                                            : 'bg-retro-bg hover:bg-retro-cyan/20'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full border-2 border-black flex items-center justify-center
                                                        ${answers[questions[currentStep - 1].id] === option.text ? 'bg-black' : 'bg-transparent'}
                                                    `}>
                                                        {answers[questions[currentStep - 1].id] === option.text && <CheckCircle size={14} className="text-retro-cyan" />}
                                                    </div>
                                                    {option.text}
                                                </button>
                                            ))
                                        )}

                                        {questions[currentStep - 1].type === 'text' && (
                                            <textarea
                                                value={answers[questions[currentStep - 1].id] || ''}
                                                onChange={e => handleAnswer(e.target.value)}
                                                className="w-full bg-retro-bg border-2 border-black p-4 text-lg min-h-[150px] focus:border-retro-cyan outline-none resize-none"
                                                placeholder="Digite sua resposta aqui..."
                                            />
                                        )}

                                        {questions[currentStep - 1].type === 'rating' && (
                                            <div className="flex justify-between gap-2">
                                                {[1, 2, 3, 4, 5].map(rating => (
                                                    <button
                                                        key={rating}
                                                        onClick={() => handleAnswer(rating)}
                                                        className={`flex-1 aspect-square border-2 border-black font-header text-xl transition-all hover:-translate-y-1 hover:shadow-pixel-sm
                                                            ${answers[questions[currentStep - 1].id] === rating
                                                                ? 'bg-retro-yellow'
                                                                : 'bg-retro-bg hover:bg-retro-yellow/50'
                                                            }`}
                                                    >
                                                        {rating}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t-2 border-black/10">
                            <button
                                onClick={handlePrevious}
                                disabled={currentStep === 0}
                                className={`flex items-center gap-2 font-bold uppercase transition-colors
                                    ${currentStep === 0 ? 'text-gray-400 cursor-not-allowed' : 'text-black hover:text-retro-comment'}
                                `}
                            >
                                <ArrowLeft size={20} />
                                Voltar
                            </button>

                            <PixelButton
                                variant="primary"
                                onClick={handleNext}
                                disabled={submitting}
                                className="px-8"
                            >
                                {submitting ? (
                                    'Enviando...'
                                ) : currentStep === questions.length ? (
                                    <>Finalizar <Send size={18} className="ml-2" /></>
                                ) : (
                                    <>Próximo <ArrowRight size={18} className="ml-2" /></>
                                )}
                            </PixelButton>
                        </div>
                    </div>

                    {/* Watermark */}
                </div>
            </div>

            {showWatermark && (
                <div className="fixed bottom-2 right-2 z-50 animate-pulse">
                    <a href="/lp" target="_blank" rel="noopener noreferrer" className="bg-white/90 px-4 py-2 rounded border-2 border-black/20 text-xs font-bold uppercase text-retro-comment flex items-center gap-2 shadow-sm">
                        Powered by <span className="text-black text-sm">CRM Marketing</span>
                    </a>
                </div>
            )}
        </div>
    );
};

// Exporting the component as default
export default PublicQuiz;
