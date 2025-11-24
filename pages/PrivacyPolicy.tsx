import React from 'react';
import { ArrowLeft, Shield, Lock, Eye, Database, UserCheck } from 'lucide-react';
import PixelButton from '../components/ui/PixelButton';

const PrivacyPolicy = () => {
  const sections = [
    {
      title: "1. Introdução e Escopo",
      icon: Shield,
      content: "Esta Política de Privacidade descreve como a StartinOS ('nós', 'nosso') coleta, usa e protege suas informações pessoais ao utilizar nossa plataforma de CRM. Estamos comprometidos com a proteção de dados e conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018)."
    },
    {
      title: "2. Dados Coletados",
      icon: Database,
      content: (
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li><strong>Dados de Cadastro:</strong> Nome, e-mail, telefone, nome da empresa e cargo.</li>
          <li><strong>Dados de Uso:</strong> Logs de acesso, interações com a plataforma e dados de navegação.</li>
          <li><strong>Dados de Leads:</strong> Informações inseridas por você sobre seus clientes (você é o Controlador, nós somos o Operador).</li>
          <li><strong>Dados Financeiros:</strong> Histórico de pagamentos (processados via Stripe, não armazenamos dados sensíveis de cartão).</li>
        </ul>
      )
    },
    {
      title: "3. Finalidade do Tratamento",
      icon: Eye,
      content: (
        <ul className="list-disc pl-6 space-y-2 mt-2">
          <li>Fornecer e melhorar os serviços do StartinOS.</li>
          <li>Processar pagamentos e emitir notas fiscais.</li>
          <li>Enviar comunicações importantes sobre sua conta e atualizações.</li>
          <li>Garantir a segurança e prevenir fraudes.</li>
          <li>Cumprir obrigações legais e regulatórias.</li>
        </ul>
      )
    },
    {
      title: "4. Compartilhamento de Dados",
      icon: UserCheck,
      content: "Não vendemos seus dados. Compartilhamos apenas com terceiros estritamente necessários para a operação (ex: processadores de pagamento, hospedagem em nuvem), todos comprometidos com a confidencialidade e segurança."
    },
    {
      title: "5. Seus Direitos (LGPD)",
      icon: Lock,
      content: (
        <div className="mt-2">
          <p>Como titular dos dados, você tem direito a:</p>
          <ul className="list-disc pl-6 space-y-2 mt-2">
            <li>Confirmar a existência de tratamento e acessar seus dados.</li>
            <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
            <li>Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários.</li>
            <li>Portabilidade dos dados a outro fornecedor de serviço.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p className="mt-4 font-bold text-retro-cyan">Para exercer seus direitos, entre em contato: contatostartin@gmail.com</p>
        </div>
      )
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
            <h1 className="font-header text-2xl md:text-3xl">Política de Privacidade</h1>
          </div>
          <span className="font-retro text-retro-comment hidden md:block">LGPD Compliant</span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-retro-surface border-4 border-black shadow-pixel p-8 md:p-12 space-y-12">
          
          <div className="text-center border-b-4 border-black pb-8">
            <Shield size={64} className="mx-auto text-retro-green mb-4" />
            <h2 className="font-header text-3xl mb-4">Sua Privacidade é Prioridade</h2>
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
            <p className="text-lg mb-4">Ainda tem dúvidas sobre como tratamos seus dados?</p>
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

export default PrivacyPolicy;
