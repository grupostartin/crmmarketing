import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AuthLayout from '../components/AuthLayout';
import { Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Acesso ao Sistema" subtitle="Entre com suas credenciais">
            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-retro-red/20 border-2 border-retro-red p-3 flex items-center gap-2 text-retro-red text-sm">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="block text-sm uppercase tracking-wider text-retro-comment">Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={18} className="text-retro-comment" />
                        </div>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-retro-bg border-2 border-retro-comment focus:border-retro-pink text-retro-fg pl-10 pr-3 py-2 outline-none transition-colors font-body text-lg"
                            placeholder="seu@email.com"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="block text-sm uppercase tracking-wider text-retro-comment">Senha</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-retro-comment" />
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-retro-bg border-2 border-retro-comment focus:border-retro-pink text-retro-fg pl-10 pr-3 py-2 outline-none transition-colors font-body text-lg"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-retro-pink hover:bg-retro-pink/90 text-black font-header text-sm py-3 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all flex items-center justify-center gap-2 uppercase"
                >
                    {loading ? 'Carregando...' : 'Entrar'}
                    {!loading && <ArrowRight size={16} />}
                </button>

                <div className="text-center pt-4 border-t-2 border-retro-surface">
                    <p className="text-retro-comment text-sm">
                        Não tem uma conta?{' '}
                        <Link to="/signup" className="text-retro-cyan hover:text-retro-cyan/80 hover:underline">
                            Criar conta
                        </Link>
                    </p>
                </div>
            </form>
        </AuthLayout>
    );
};

export default Login;
