import React, { useState } from 'react';
import { Check, X, Zap, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAgency } from '../context/AgencyContext';

const Plans = () => {
    const [loading, setLoading] = useState(false);
    const { agency, currentUserRole } = useAgency();

    const handleSubscribe = async () => {
        if (currentUserRole !== 'owner') {
            alert('Apenas o dono da agência pode gerenciar a assinatura.');
            return;
        }

        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (!session) {
                // Redirect to login if not authenticated
                window.location.href = '/login';
                return;
            }

            // Call the Supabase Function to create a checkout session
            const { data, error } = await supabase.functions.invoke('stripe-checkout', {
                body: {
                    priceId: 'price_1SWssuL51QoDK0cOr5xJNcxz', // User needs to replace this
                    returnUrl: window.location.origin + '/plans',
                },
            });

            if (error) throw error;

            if (data?.url) {
                window.location.href = data.url;
            }
        } catch (error) {
            console.error('Error creating checkout session:', error);
            alert('Erro ao iniciar o pagamento. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const isProActive = agency?.subscription_tier === 'pro' && agency?.subscription_status === 'active';

    const PlanCard = ({ 
        title, 
        price, 
        features, 
        isPro = false, 
        buttonText, 
        onClick,
        disabled = false,
        current = false
    }: { 
        title: string; 
        price: string; 
        features: { text: string; available: boolean }[]; 
        isPro?: boolean;
        buttonText: string;
        onClick?: () => void;
        disabled?: boolean;
        current?: boolean;
    }) => (
        <div className={`relative p-6 border-4 border-black flex flex-col h-full transition-all ${
            isPro ? 'bg-retro-surface' : 'bg-retro-bg'
        } ${current ? 'ring-4 ring-retro-green ring-offset-4 ring-offset-retro-bg' : ''}`}>
            {isPro && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-retro-cyan border-4 border-black px-4 py-1 shadow-pixel-sm z-10">
                    <span className="font-header text-black text-sm tracking-wider">ILIMITADO</span>
                </div>
            )}
            
            {current && (
                <div className="absolute -top-4 right-4 bg-retro-green border-2 border-black px-3 py-1 shadow-pixel-sm z-10 rotate-3">
                    <span className="font-header text-black text-xs tracking-wider">SEU PLANO</span>
                </div>
            )}
            
            <h3 className={`font-header text-3xl mb-2 ${isPro ? 'text-retro-cyan' : 'text-retro-fg'}`}>{title}</h3>
            <div className="flex items-baseline gap-2 mb-8">
                <span className="font-header text-4xl">{price}</span>
                <span className="text-retro-comment text-sm">/mês</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <div className={`mt-1 ${feature.available ? (isPro ? 'text-retro-cyan' : 'text-retro-fg') : 'text-retro-comment'}`}>
                            {feature.available ? <Check size={18} strokeWidth={3} /> : <X size={18} strokeWidth={3} />}
                        </div>
                        <span className={`font-body text-lg ${feature.available ? 'text-retro-fg' : 'text-retro-comment line-through'}`}>
                            {feature.text}
                        </span>
                    </li>
                ))}
            </ul>

            <button 
                onClick={onClick}
                disabled={disabled || loading || current}
                className={`w-full py-4 border-b-4 border-r-4 border-black font-header text-lg tracking-wider uppercase transition-all active:border-0 active:translate-y-1 active:ml-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:translate-y-0 disabled:active:ml-0 disabled:active:border-b-4 disabled:active:border-r-4 ${
                    isPro 
                        ? 'bg-retro-cyan hover:bg-retro-cyan/90 text-black' 
                        : 'bg-transparent border-2 hover:bg-retro-surface text-retro-fg'
                }`}
            >
                {loading && isPro ? 'Carregando...' : current ? 'Plano Atual' : buttonText}
            </button>
            
            {isPro && currentUserRole !== 'owner' && !current && (
                <p className="text-center text-retro-comment text-xs mt-2">
                    Apenas o dono da agência pode assinar
                </p>
            )}
        </div>
    );

    const freeFeatures = [
        { text: '1 Quiz (Não editável)', available: true },
        { text: 'Até 5 Clientes', available: true },
        { text: 'Até 5 Contratos', available: true },
        { text: 'Até 2 Usuários', available: true },
        { text: 'Marca d\'água no Quiz', available: true },
        { text: 'Suporte Prioritário', available: false },
    ];

    const proFeatures = [
        { text: 'Acesso Ilimitado à Plataforma', available: true },
        { text: 'Quizzes Ilimitados & Editáveis', available: true },
        { text: 'Clientes & Contratos Ilimitados', available: true },
        { text: 'Até 10 Usuários', available: true },
        { text: 'Sem Marca d\'água', available: true },
        { text: 'Suporte Prioritário', available: true },
    ];

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <div className="text-center mb-12">
                <h1 className="font-header text-4xl mb-4 text-retro-fg">Escolha seu Plano</h1>
                <p className="text-retro-comment text-xl font-body">Desbloqueie todo o potencial do seu CRM</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-start">
                <PlanCard 
                    title="Grátis" 
                    price="R$ 0" 
                    features={freeFeatures} 
                    buttonText="Começar Grátis"
                    onClick={() => window.location.href = '/'}
                    current={!isProActive}
                    disabled={isProActive} // Disable free plan if pro is active
                />
                <PlanCard 
                    title="Pro" 
                    price="R$ 97,90" 
                    features={proFeatures} 
                    isPro={true} 
                    buttonText="Assinar Pro"
                    onClick={handleSubscribe}
                    current={isProActive}
                    disabled={currentUserRole !== 'owner' && !isProActive}
                />
            </div>
        </div>
    );
};

export default Plans;
