import React from 'react';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle, HelpCircle } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';

const TermsOfUse = () => {
  const sections = [
    {
      title: "1. Aceitação dos Termos",
      icon: CheckCircle,
      content: "Ao acessar e usar a plataforma StartinOS, você concorda em cumprir estes Termos de Uso e todas as leis e regulamentos aplicáveis. Se você não concordar com algum destes termos, está proibido de usar ou acessar este site."
    },
    {
      title: "2. Uso da Licença",
      icon: FileText,
      content: "É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site StartinOS, apenas para visualização transitória pessoal e não comercial. Esta é a concessão de uma licença, não uma transferência de título."
    },
    {
      title: "3. Isenção de Responsabilidade",
      icon: AlertCircle,
      content: "Os materiais no site da StartinOS são fornecidos 'como estão'. A StartinOS não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização."
    },
    {
      title: "4. Limitações",
      icon: Scale,
      content: "Em nenhum caso a StartinOS ou seus fornecedores serão responsáveis por quaisquer danos (incluindo, sem limitação, danos por perda de dados ou lucro ou devido a interrupção dos negócios) decorrentes do uso ou da incapacidade de usar os materiais em StartinOS."
    },
    {
      title: "5. Precisão dos Materiais",
      icon: HelpCircle,
      content: "Os materiais exibidos no site da StartinOS podem incluir erros técnicos, tipográficos ou fotográficos. A StartinOS não garante que qualquer material em seu site seja preciso, completo ou atual."
    }
  ];

  return (
    <div className="min-h-screen bg-retro-bg text-retro-fg font-sans selection:bg-retro-pink selection:text-black">
      {/* Header */}
      <header className="bg-retro-bg border-b-4 border-black py-6 px-6 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <PixelButton variant="secondary" onClick={() => window.location.href = '/lp'}>
              <ArrowLeft size={20} />
            </PixelButton>
            <h1 className="font-header text-2xl md:text-3xl">Termos de Uso</h1>
          </div>
          <span className="font-retro text-retro-comment hidden md:block">Versão 1.0</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-retro-surface border-4 border-black shadow-pixel p-8 md:p-12 space-y-12">
          
          <div className="text-center border-b-4 border-black pb-8">
            <FileText size={64} className="mx-auto text-retro-cyan mb-4" />
            <h2 className="font-header text-3xl mb-4">Regras do Jogo</h2>
            <p className="text-xl text-retro-comment">
              Última atualização: 24 de Novembro de 2025
            </p>
          </div>

          <div className="space-y-12">
            {sections.map((section, index) => (
              <section key={index} className="group">
                <div className="flex items-start gap-4 mb-4">
                  <div className="bg-retro-bg border-2 border-black p-3 group-hover:border-retro-cyan transition-colors">
                    <section.icon size={24} className="text-retro-cyan" />
                  </div>
                  <h3 className="font-header text-xl md:text-2xl pt-2">{section.title}</h3>
                </div>
                <div className="pl-[4.5rem] text-lg text-gray-300 leading-relaxed">
                  {section.content}
                </div>
              </section>
            ))}
          </div>

          <div className="bg-retro-bg border-2 border-black p-6 mt-8 text-center">
            <p className="text-lg mb-4">Dúvidas sobre os termos?</p>
            <a 
              href="mailto:contatostartin@gmail.com" 
              className="font-header text-retro-cyan hover:underline decoration-2 underline-offset-4 text-xl"
            >
              contatostartin@gmail.com
            </a>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black py-8 text-center border-t-4 border-gray-800 mt-12">
        <p className="font-body text-gray-500">StartinOS &copy; 2025 - Todos os direitos reservados.</p>
      </footer>
    </div>
  );
};

export default TermsOfUse;
