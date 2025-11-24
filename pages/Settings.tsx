import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import { Moon, Sun, Type, Image as ImageIcon, Save, Loader } from 'lucide-react';

const Settings = () => {
    const { themeMode, setThemeMode, themeStyle, setThemeStyle, profileImage, setProfileImage, agencyName, setAgencyName, saveSettings } = useTheme();
    const [uploading, setUploading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('Você deve selecionar uma imagem para upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

            setProfileImage(data.publicUrl);
        } catch (error) {
            alert('Erro ao fazer upload da imagem!');
            console.error(error);
        } finally {
            setUploading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            setUploading(true);
            await saveSettings();
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="font-header text-3xl text-retro-fg">Configurações</h1>
                <p className="text-retro-comment text-lg">Personalize sua experiência no AgencyFlow.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Theme Settings */}
                <div className="bg-retro-surface border-4 border-black p-8 shadow-pixel">
                    <h2 className="font-header text-xl text-retro-fg mb-6 flex items-center gap-3">
                        <Sun size={24} className="text-retro-yellow" />
                        Aparência
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-retro-comment text-sm font-bold mb-3 uppercase">Tema</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setThemeMode('light')}
                                    className={`flex-1 p-4 border-4 transition-all flex flex-col items-center gap-2 ${themeMode === 'light'
                                        ? 'border-retro-pink bg-retro-bg'
                                        : 'border-black bg-retro-bg/50 hover:bg-retro-bg'
                                        }`}
                                >
                                    <Sun size={32} className={themeMode === 'light' ? 'text-retro-pink' : 'text-retro-comment'} />
                                    <span className={themeMode === 'light' ? 'text-retro-pink font-bold' : 'text-retro-comment'}>Claro</span>
                                </button>
                                <button
                                    onClick={() => setThemeMode('dark')}
                                    className={`flex-1 p-4 border-4 transition-all flex flex-col items-center gap-2 ${themeMode === 'dark'
                                        ? 'border-retro-cyan bg-retro-bg'
                                        : 'border-black bg-retro-bg/50 hover:bg-retro-bg'
                                        }`}
                                >
                                    <Moon size={32} className={themeMode === 'dark' ? 'text-retro-cyan' : 'text-retro-comment'} />
                                    <span className={themeMode === 'dark' ? 'text-retro-cyan font-bold' : 'text-retro-comment'}>Escuro</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-retro-comment text-sm font-bold mb-3 uppercase">Estilo da Fonte</label>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setThemeStyle('retro')}
                                    className={`flex-1 p-4 border-4 transition-all flex flex-col items-center gap-2 ${themeStyle === 'retro'
                                        ? 'border-retro-yellow bg-retro-bg'
                                        : 'border-black bg-retro-bg/50 hover:bg-retro-bg'
                                        }`}
                                >
                                    <span className="font-header text-2xl">Aa</span>
                                    <span className={themeStyle === 'retro' ? 'text-retro-yellow font-bold' : 'text-retro-comment'}>Retrô (Pixel)</span>
                                </button>
                                <button
                                    onClick={() => setThemeStyle('minimalist')}
                                    className={`flex-1 p-4 border-4 transition-all flex flex-col items-center gap-2 ${themeStyle === 'minimalist'
                                        ? 'border-retro-green bg-retro-bg'
                                        : 'border-black bg-retro-bg/50 hover:bg-retro-bg'
                                        }`}
                                >
                                    <span className="font-sans text-2xl font-bold">Aa</span>
                                    <span className={themeStyle === 'minimalist' ? 'text-retro-green font-bold' : 'text-retro-comment'}>Minimalista</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Agency Name */}
                <div className="bg-retro-surface border-4 border-black p-8 shadow-pixel">
                    <h2 className="font-header text-xl text-retro-fg mb-6 flex items-center gap-3">
                        <Type size={24} className="text-retro-cyan" />
                        Nome da Agência
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-retro-comment text-sm font-bold mb-2 uppercase">
                                Nome da sua agência
                            </label>
                            <input
                                type="text"
                                value={agencyName}
                                onChange={(e) => setAgencyName(e.target.value)}
                                placeholder="AgencyFlow"
                                className="w-full bg-retro-bg border-2 border-black p-3 text-retro-fg focus:border-retro-cyan outline-none"
                            />
                            <p className="text-retro-comment text-xs mt-2">
                                Este nome aparecerá nas mensagens de agradecimento dos quizzes.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Image */}
                <div className="bg-retro-surface border-4 border-black p-8 shadow-pixel md:col-span-2">
                    <h2 className="font-header text-xl text-retro-fg mb-6 flex items-center gap-3">
                        <ImageIcon size={24} className="text-retro-pink" />
                        Foto de Perfil
                    </h2>
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-32 h-32 border-4 border-black overflow-hidden bg-retro-bg flex items-center justify-center">
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-retro-comment text-4xl font-bold">?</div>
                                )}
                            </div>
                            <label className="absolute bottom-0 right-0 bg-retro-pink border-2 border-black p-2 cursor-pointer hover:bg-retro-pink/80 transition-colors shadow-pixel-sm">
                                {uploading ? <Loader size={16} className="animate-spin text-black" /> : <ImageIcon size={16} className="text-black" />}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        </div>

                        <div className="text-center w-full">
                            <p className="text-retro-comment text-sm mb-4">Clique no ícone acima para alterar sua foto.</p>

                            <button
                                onClick={handleSaveSettings}
                                disabled={uploading}
                                type="button"
                                className="bg-retro-green hover:bg-retro-green/90 text-black font-header text-sm py-2 px-6 border-b-4 border-r-4 border-black active:border-0 active:translate-y-1 active:ml-1 transition-all uppercase flex items-center justify-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {uploading ? 'Salvando...' : 'Salvar Configurações'}
                                {!uploading && <Save size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Success Modal */}
            {showSuccess && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-retro-green border-4 border-black p-8 shadow-pixel max-w-md mx-4 animate-bounce-in">
                        <div className="text-center">
                            <div className="text-6xl mb-4">✓</div>
                            <h2 className="font-header text-2xl text-black mb-2">Sucesso!</h2>
                            <p className="text-black text-lg">Configurações salvas com sucesso!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Settings;
