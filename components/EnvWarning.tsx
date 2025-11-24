import React from 'react';
import { AlertTriangle } from 'lucide-react';

const EnvWarning = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey && 
      supabaseUrl !== 'https://placeholder.supabase.co' && 
      supabaseAnonKey !== 'placeholder-key') {
    return null;
  }

  return (
    <div className="bg-retro-red/20 border-4 border-retro-red p-4 mb-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-retro-red flex-shrink-0 mt-1" size={24} />
        <div className="flex-1">
          <h3 className="font-header text-retro-red text-lg mb-2">⚠️ Variáveis de Ambiente Não Configuradas</h3>
          <p className="text-retro-fg mb-2">
            Para usar esta aplicação, você precisa configurar as variáveis de ambiente do Supabase.
          </p>
          <ol className="list-decimal list-inside text-retro-comment space-y-1 text-sm">
            <li>Crie um arquivo <code className="bg-retro-bg px-1">.env</code> na raiz do projeto</li>
            <li>Adicione as seguintes variáveis:
              <pre className="bg-retro-bg border-2 border-black p-2 mt-2 text-xs">
{`VITE_SUPABASE_URL=seu_url_aqui
VITE_SUPABASE_ANON_KEY=sua_chave_aqui`}
              </pre>
            </li>
            <li>Reinicie o servidor de desenvolvimento</li>
          </ol>
          <p className="text-retro-comment text-sm mt-2">
            Veja o arquivo <code className="bg-retro-bg px-1">.env.example</code> ou o README.md para mais informações.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EnvWarning;

