import React, { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const ProtectedRoute = () => {
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            if (!supabase) {
                setAuthenticated(false);
                setLoading(false);
                return;
            }

            const { data: { session } } = await supabase.auth.getSession();
            setAuthenticated(!!session);
            setLoading(false);
        };

        checkAuth();

        if (supabase) {
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setAuthenticated(!!session);
                setLoading(false);
            });

            return () => subscription.unsubscribe();
        }
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
