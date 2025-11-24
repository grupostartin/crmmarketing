import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProtectedRoute = () => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkAuth = async () => {
            if (!supabase) {
                if (mounted) {
                    setAuthenticated(false);
                    setLoading(false);
                }
                return;
            }

            try {
                // Race condition: if getSession takes too long (> 2s), treat as unauthenticated
                // This prevents the "Loading..." screen from hanging indefinitely in tests or poor network
                const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ data: { session: null } }), 2000));
                const sessionPromise = supabase.auth.getSession();
                
                const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

                if (mounted) {
                    setAuthenticated(!!session);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                if (mounted) {
                    setAuthenticated(false);
                    setLoading(false);
                }
            }
        };

        checkAuth();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                if (mounted) {
                    setAuthenticated(!!session);
                    setLoading(false);
                }
            });

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        }

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-retro-bg flex items-center justify-center">
                <div className="text-retro-cyan font-header animate-pulse text-xl">
                    CARREGANDO...
                </div>
            </div>
        );
    }

    if (!authenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
