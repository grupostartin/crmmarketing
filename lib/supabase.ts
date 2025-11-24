import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar se as variáveis de ambiente estão configuradas
const isValidUrl = supabaseUrl && 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseUrl.startsWith('https://') &&
  supabaseUrl.includes('.supabase.co');

const isValidKey = supabaseAnonKey && 
  supabaseAnonKey !== 'placeholder-key' &&
  supabaseAnonKey.length > 20;

if (!isValidUrl || !isValidKey) {
  console.error('⚠️ Missing or invalid Supabase environment variables!');
  console.error('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('For local development: create a .env file');
  console.error('For production: configure environment variables in your hosting platform');
  console.error('See .env.example or README.md for reference');
}

// Criar cliente apenas se as variáveis forem válidas
// Caso contrário, exportar null para que os componentes possam verificar
export const supabase: SupabaseClient | null = (isValidUrl && isValidKey && supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Exportar função helper para verificar se Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return supabase !== null;
};
