import React from 'react';
import EnvWarning from './EnvWarning';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
    return (
        <div className="min-h-screen bg-retro-bg flex items-center justify-center p-4 font-body text-retro-fg">
            <div className="w-full max-w-md bg-retro-surface border-4 border-black shadow-pixel p-8 relative">
                {/* Decorative corner squares */}
                <div className="absolute -top-2 -left-2 w-4 h-4 bg-retro-pink border-2 border-black"></div>
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-retro-cyan border-2 border-black"></div>
                <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-retro-yellow border-2 border-black"></div>
                <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-retro-green border-2 border-black"></div>

                <div className="text-center mb-8">
                    <div className="inline-block w-12 h-12 bg-retro-cyan border-2 border-black shadow-pixel-sm mb-4"></div>
                    <h1 className="font-header text-2xl text-retro-pink mb-2 uppercase tracking-wide">{title}</h1>
                    {subtitle && <p className="text-retro-comment text-lg">{subtitle}</p>}
                </div>

                <div className="mb-4">
                    <EnvWarning />
                </div>

                {children}
            </div>
        </div>
    );
};

export default AuthLayout;
