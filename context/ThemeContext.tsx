import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type ThemeMode = 'light' | 'dark';
type ThemeStyle = 'retro' | 'minimalist';

interface ThemeContextType {
    themeMode: ThemeMode;
    themeStyle: ThemeStyle;
    profileImage: string | null;
    agencyName: string;
    setThemeMode: (mode: ThemeMode) => void;
    setThemeStyle: (style: ThemeStyle) => void;
    setProfileImage: (image: string | null) => void;
    setAgencyName: (name: string) => void;
    saveSettings: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
    const [themeStyle, setThemeStyle] = useState<ThemeStyle>('retro');
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [agencyName, setAgencyName] = useState<string>('StartinOS');

    useEffect(() => {
        const storedMode = localStorage.getItem('themeMode') as ThemeMode;
        const storedStyle = localStorage.getItem('themeStyle') as ThemeStyle;
        if (storedMode) setThemeMode(storedMode);
        if (storedStyle) setThemeStyle(storedStyle);

        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (data) {
                    setThemeMode(data.theme_mode);
                    setThemeStyle(data.theme_style);
                    setProfileImage(data.avatar_url);
                    // Não carregar agency_name do perfil - será gerenciado pelo sistema de agências
                    localStorage.setItem('themeMode', data.theme_mode);
                    localStorage.setItem('themeStyle', data.theme_style);
                }
            }
        };

        loadProfile();
    }, []);

    useEffect(() => {
        document.body.classList.remove('theme-light', 'theme-dark');
        document.body.classList.add(`theme-${themeMode}`);

        document.body.classList.remove('font-retro', 'font-sans');
        document.body.classList.add(themeStyle === 'retro' ? 'font-retro' : 'font-sans');

        localStorage.setItem('themeMode', themeMode);
        localStorage.setItem('themeStyle', themeStyle);

        const saveThemeOnly = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { error } = await supabase.from('profiles').update({
                    theme_mode: themeMode,
                    theme_style: themeStyle,
                    updated_at: new Date().toISOString()
                }).eq('id', user.id);

                if (error) {
                    await supabase.from('profiles').upsert({
                        id: user.id,
                        theme_mode: themeMode,
                        theme_style: themeStyle,
                        avatar_url: profileImage,
                        updated_at: new Date().toISOString()
                    });
                }
            }
        }

        saveThemeOnly();

    }, [themeMode, themeStyle]);

    const saveSettings = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase.from('profiles').upsert({
                id: user.id,
                theme_mode: themeMode,
                theme_style: themeStyle,
                avatar_url: profileImage,
                updated_at: new Date().toISOString()
            });

            if (error) {
                console.error('Error saving settings:', error);
                throw error;
            }
        }
    };

    return (
        <ThemeContext.Provider value={{
            themeMode,
            setThemeMode,
            themeStyle,
            setThemeStyle,
            profileImage,
            setProfileImage,
            agencyName,
            setAgencyName,
            saveSettings
        }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
