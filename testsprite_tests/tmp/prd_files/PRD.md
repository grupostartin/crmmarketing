# Product Requirements Document (PRD) - StartinOS CRM

## 1. Visão Geral do Produto
**Nome do Projeto:** StartinOS CRM (Marketing Agency CRM)
**Versão Atual:** 0.0.0 (Beta)
**Descrição:** O StartinOS é um CRM focado em agências de marketing, combinando gestão de relacionamento com clientes (CRM), pipelines de vendas, geração de leads através de quizzes interativos e gestão administrativa da agência. O diferencial visual é uma estética "Retro/Pixel Art", proporcionando uma experiência de uso gamificada e única.

## 2. Objetivos e Escopo
*   **Centralização:** Fornecer um hub único para agências gerenciarem leads, contratos e equipe.
*   **Engajamento:** Utilizar quizzes interativos como ferramentas de captura de leads (Lead Magnets).
*   **Monetização:** Modelo SaaS com planos de assinatura (Free, Pro, Enterprise) integrados via Stripe.
*   **Identidade Visual:** Interface moderna com estética retro (Pixel Art/Brutalism) para diferenciação no mercado.

## 3. Público Alvo
*   Donos de Agências de Marketing Digital.
*   Gestores de Tráfego e Vendas.
*   Equipes de Atendimento e Sales.

## 4. Especificações Técnicas (Tech Stack)

### Frontend
*   **Framework:** React 19 + Vite.
*   **Linguagem:** TypeScript.
*   **Estilização:** Tailwind CSS (com tema customizado `retro-*`).
*   **Roteamento:** React Router DOM v7.
*   **Ícones:** Lucide React.
*   **Charts:** Recharts.
*   **Drag & Drop:** @dnd-kit (para Pipeline/Kanban).
*   **Interatividade:** React Confetti.

### Backend & Infraestrutura
*   **BaaS (Backend as a Service):** Supabase.
    *   **Auth:** Gerenciamento de usuários e sessões.
    *   **Database:** PostgreSQL.
    *   **Storage:** Armazenamento de arquivos (imagens de perfil, uploads).
    *   **Edge Functions:** Lógica server-side (webhooks do Stripe).
*   **Pagamentos:** Stripe (Assinaturas recorrentes).
*   **Hospedagem:** Vercel (Sugerido/Inferido).

## 5. Funcionalidades Principais

### 5.1. Autenticação e Segurança
*   Login e Cadastro de usuários.
*   Recuperação de senha.
*   **Role-Based Access Control (RBAC):**
    *   **Owner:** Acesso total, gestão de planos e pagamentos.
    *   **Admin/Manager:** Gestão de equipe e configurações operacionais.
    *   **Staff/Member:** Acesso operacional (Pipeline, Contatos).
*   Páginas protegidas (`ProtectedRoute`) e Layout de Autenticação dedicado.

### 5.2. Agência e Equipe (`/agency`)
*   Criação de perfil da agência.
*   Convite de membros via link único (Token system).
*   Gestão de permissões e remoção de membros.
*   Contexto global de Agência (`AgencyContext`).

### 5.3. Dashboard (`/`)
*   Visão geral de métricas (KPIs).
*   Gráficos de desempenho (Recharts).
*   Atalhos para ações rápidas.

### 5.4. CRM & Pipeline (`/pipeline`, `/contacts`)
*   **Pipeline:** Visualização Kanban (Drag & Drop) para gestão de leads e estágios de venda.
*   **Contatos:** Listagem, criação e edição de clientes/leads.
*   Histórico de interações (previsto).

### 5.5. Ferramentas de Marketing (Quizzes - `/quiz`)
*   **Quiz Builder:** Criador de quizzes interativos para captura de leads.
*   **Public Quiz:** Páginas públicas para responder quizzes (Lead Gen).
*   **Resultados:** Armazenamento e análise das respostas.

### 5.6. Gestão Financeira e Administrativa
*   **Contratos (`/contracts`):** Repositório e gestão de contratos de clientes.
*   **Planos (`/plans`):**
    *   Integração com Stripe Checkout.
    *   Upgrade/Downgrade de planos.
    *   Bloqueio de funcionalidades baseado no tier (Limites de uso).
    *   Banner de aviso para plano Grátis.

### 5.7. Landing Page (`/lp`)
*   Página de apresentação do produto para novos usuários (Marketing do próprio SaaS).

## 6. Design System & UI
*   **Tema:** Retro/Pixel Art.
*   **Paleta de Cores:**
    *   `retro-bg`: Fundo principal.
    *   `retro-surface`: Elementos de cartão/container.
    *   `retro-pink`, `retro-cyan`, `retro-yellow`: Acentos e destaques.
*   **Componentes Chave:**
    *   Botões com sombra "pixelada" dura (Hard shadows).
    *   Bordas grossas (Border-2/4 black).
    *   Tipografia "Header" e "Body" distintas.

## 7. Estrutura de Rotas (Sitemap)

| Rota | Descrição | Acesso |
| :--- | :--- | :--- |
| `/` | Dashboard Principal | Autenticado |
| `/lp` | Landing Page | Público |
| `/login`, `/signup` | Autenticação | Público |
| `/invite/:token` | Aceite de convite | Público/Autenticado |
| `/pipeline` | Kanban de Vendas | Autenticado |
| `/quiz` | Listagem de Quizzes | Autenticado |
| `/quiz/builder/:id` | Criação/Edição de Quiz | Autenticado |
| `/quiz/public/:id` | Quiz para preenchimento | Público |
| `/contracts` | Contratos | Autenticado |
| `/contacts` | Base de Contatos | Autenticado |
| `/agency` | Gestão da Equipe | Autenticado |
| `/plans` | Assinatura e Billing | Autenticado (Owner) |
| `/settings` | Configurações Gerais | Autenticado |

## 8. Banco de Dados (Entidades Principais)
*   `agencies`: Dados da empresa, tier de assinatura.
*   `profiles`: Dados do usuário, vínculo com agência.
*   `agency_invitations`: Convites pendentes.
*   `contacts`: Leads e clientes.
*   `pipelines/columns/deals`: Estrutura do CRM.
*   `quizzes/questions/answers`: Estrutura dos Quizzes.
*   `contracts`: Metadados de contratos.

## 9. Futuro e Melhorias (Roadmap Sugerido)
*   Automação de e-mails baseada em etapas do Pipeline.
*   Integração com WhatsApp (API).
*   Relatórios avançados de conversão dos Quizzes.
*   App Mobile ou PWA aprimorado.
