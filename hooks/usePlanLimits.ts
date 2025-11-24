import { useAgency } from '../context/AgencyContext';
import { PLAN_LIMITS } from '../lib/limits';

type LimitFeature = 'quizzes' | 'clients' | 'contracts' | 'users';

export const usePlanLimits = () => {
    const { agency, members } = useAgency();

    const currentPlan = (agency?.subscription_tier as 'free' | 'pro') || 'free';
    const limits = PLAN_LIMITS[currentPlan];

    const checkLimit = (feature: LimitFeature, currentCount: number): boolean => {
        // Se não tiver agência carregada, bloqueia por segurança (ou libera se preferir fail-open)
        if (!agency) return true;

        // Se for pro, geralmente é infinito, mas verificamos o valor
        const limit = limits[feature];

        if (typeof limit === 'number') {
            return currentCount >= limit;
        }

        // Se for boolean (watermark), não é um limite numérico de contagem
        return false;
    };

    const getLimit = (feature: LimitFeature) => {
        return limits[feature];
    };

    const hasWatermark = limits.watermark;

    return {
        currentPlan,
        limits,
        checkLimit,
        getLimit,
        hasWatermark
    };
};
