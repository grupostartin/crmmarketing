import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader, CheckCircle, XCircle, ArrowRight, Building2 } from 'lucide-react';
import PixelCard from '../components/ui/PixelCard';
import PixelButton from '../components/ui/PixelButton';

const InvitePage = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteDetails, setInviteDetails] = useState<{
        agency_name: string;
        inviter_name: string;
        role: string;
        is_valid: boolean;
    } | null>(null);
    const [accepting, setAccepting] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        checkUserAndInvite();
    }, [token]);

    const checkUserAndInvite = async () => {
        try {
            setLoading(true);

            // Check current user
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (!token) {
                throw new Error('Token de convite inválido.');
            }

            // Fetch invite details
            const { data, error } = await supabase.rpc('get_invitation_details', {
                invite_token: token
            });

            if (error) throw error;

            if (!data || data.length === 0) {
                throw new Error('Convite não encontrado.');
            }

            const details = data[0];
            setInviteDetails(details);

            if (!details.is_valid) {
                throw new Error('Este convite expirou ou já foi utilizado.');
            }

        } catch (err: any) {
            console.error('Error checking invite:', err);
            setError(err.message || 'Erro ao carregar convite.');
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async () => {
        if (!user) {
            // Redirect to login/signup with return url
            // For now, let's just redirect to login and they might lose the flow if we don't handle it.
            // Better: Show "Login to Accept" or "Sign Up to Accept" buttons that go to auth pages 
            // passing the invite link as a query param or state?
            // Or simpler: The user clicks "Login" and after login, they should manually come back? 
            // No, that's bad UX.
            // Let's assume the user needs to be logged in. If not, we show buttons to Login/Signup.
            // After auth, they should be redirected back here.
            // We can use the `redirectTo` param in Supabase auth, or just `state` in react-router.
            navigate('/login', { state: { from: `/invite/${token}` } });
            return;
        }

        try {
            setAccepting(true);
            const { data, error } = await supabase.rpc('accept_invitation', {
                invite_token: token
            });

            if (error) throw error;

            // Success! Redirect to dashboard
            navigate('/');
        } catch (err: any) {
            console.error('Error accepting invite:', err);
            setError(err.message || 'Erro ao aceitar convite.');
        } finally {
            setAccepting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader size={48} className="text-retro-pink animate-spin" />
                    <p className="text-retro-fg font-header text-xl">Carregando convite...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
                <PixelCard className="max-w-md w-full text-center">
                    <div className="flex justify-center mb-4">
                        <XCircle size={64} className="text-retro-red" />
                    </div>
                    <h1 className="font-header text-2xl text-retro-fg mb-2">Ops! Algo deu errado</h1>
                    <p className="text-retro-comment mb-6">{error}</p>
                    <Link to="/">
                        <PixelButton variant="primary">Voltar ao Início</PixelButton>
                    </Link>
                </PixelCard>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4">
            <PixelCard className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-retro-surface border-4 border-black mx-auto mb-4 flex items-center justify-center shadow-pixel">
                        <Building2 size={40} className="text-retro-cyan" />
                    </div>
                    <h1 className="font-header text-2xl text-retro-fg mb-2">Convite para Agência</h1>
                    <p className="text-retro-comment">
                        Você foi convidado para participar da agência <br />
                        <span className="text-retro-fg font-bold text-xl block mt-2">{inviteDetails?.agency_name}</span>
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="bg-retro-surface border-2 border-black p-4 text-center">
                        <p className="text-sm text-retro-comment uppercase mb-1">Convidado por</p>
                        <p className="font-bold text-retro-fg">{inviteDetails?.inviter_name || 'Um administrador'}</p>
                    </div>

                    <div className="bg-retro-surface border-2 border-black p-4 text-center">
                        <p className="text-sm text-retro-comment uppercase mb-1">Função</p>
                        <p className="font-bold text-retro-fg uppercase">
                            {inviteDetails?.role === 'owner' ? 'Dono' :
                                inviteDetails?.role === 'manager' ? 'Gerente' : 'Geral'}
                        </p>
                    </div>

                    {user ? (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-2 text-sm text-retro-comment">
                                <span>Logado como</span>
                                <span className="text-retro-fg font-bold">{user.email}</span>
                            </div>
                            <PixelButton
                                variant="primary"
                                className="w-full py-4 text-lg"
                                onClick={handleAccept}
                                disabled={accepting}
                            >
                                {accepting ? 'Entrando...' : 'Aceitar Convite'}
                                {!accepting && <ArrowRight size={20} className="ml-2" />}
                            </PixelButton>
                            <button
                                onClick={() => supabase.auth.signOut().then(() => checkUserAndInvite())}
                                className="w-full text-center text-retro-comment hover:text-retro-red text-sm underline"
                            >
                                Não é você? Sair
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-center text-retro-comment text-sm">
                                Você precisa estar logado para aceitar o convite.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <Link to="/login" state={{ from: `/invite/${token}` }} className="block">
                                    <PixelButton variant="secondary" className="w-full">Entrar</PixelButton>
                                </Link>
                                <Link to="/signup" state={{ from: `/invite/${token}` }} className="block">
                                    <PixelButton variant="primary" className="w-full">Cadastrar</PixelButton>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </PixelCard>
        </div>
    );
};

export default InvitePage;
