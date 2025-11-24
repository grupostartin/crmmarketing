# CRM Marketing - StartinOS

Sistema de CRM (Customer Relationship Management) com design retro pixelado, desenvolvido para gerenciar leads, contratos, pipeline de vendas e quizzes interativos.

## 🚀 Funcionalidades

- **Dashboard Executivo**: Métricas em tempo real, gráficos de crescimento e distribuição de leads
- **Gestão de Contatos**: CRUD completo com busca, filtros e exportação
- **Pipeline de Vendas**: Kanban interativo para gerenciar negócios
- **Gestão de Contratos**: Controle de MRR, renovações e status
- **Quizzes Interativos**: Criação e publicação de quizzes para captação de leads
- **Atividades**: Registro de interações com contatos
- **Exportação**: Relatórios em CSV para análise

## 🛠️ Tecnologias

- **React 19** com TypeScript
- **Vite** para build e desenvolvimento
- **Supabase** para backend (PostgreSQL + Auth + RLS)
- **React Router** para navegação
- **Recharts** para gráficos
- **TailwindCSS** para estilização
- **Lucide React** para ícones

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Supabase (gratuita)
- Git

## 🔧 Instalação

1. **Clone o repositório**
   ```bash
   git clone https://github.com/seu-usuario/crm-marketing.git
   cd crm-marketing
   ```

2. **Instale as dependências**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente**
   
   Copie o arquivo `.env.example` para `.env`:
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env` e adicione suas credenciais do Supabase:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon
   ```
   
   **Como obter as credenciais (Passo a Passo):**
   
   1. **Acesse o Supabase**
      - Vá para [https://app.supabase.com](https://app.supabase.com)
      - Faça login ou crie uma conta gratuita
   
   2. **Crie ou selecione um projeto**
      - Se não tiver um projeto, clique em "New Project"
      - Preencha o nome do projeto, senha do banco de dados e escolha uma região
      - Aguarde alguns minutos enquanto o projeto é criado
      - Se já tiver um projeto, selecione-o na lista
   
   3. **Acesse as configurações da API**
      - No menu lateral esquerdo, clique em **"Settings"** (ícone de engrenagem)
      - Depois clique em **"API"** no submenu
   
   4. **Copie as credenciais**
      - **Project URL**: Encontre a seção "Project URL" e copie a URL completa
        - Exemplo: `https://abcdefghijklmnop.supabase.co`
      - **anon public key**: Na seção "Project API keys", encontre a chave chamada **"anon"** ou **"public"**
        - Clique no ícone de "eye" (olho) para revelar a chave
        - Clique no ícone de cópia ao lado da chave para copiar
        - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (chave muito longa)
   
   5. **Cole no arquivo .env**
      ```env
      VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
      VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
      ```
   
   **⚠️ Importante:**
   - Nunca compartilhe sua chave `anon` publicamente (ela já está exposta no frontend, mas é segura devido ao RLS)
   - Use a chave `anon` ou `public`, NÃO use a chave `service_role` (ela tem acesso total e é perigosa no frontend)
   - A URL sempre termina com `.supabase.co`

4. **Configure o banco de dados**
   
   Execute as migrations no Supabase SQL Editor:
   - As tabelas serão criadas automaticamente quando você usar a aplicação pela primeira vez
   - Ou execute manualmente as migrations que estão no diretório `supabase/migrations` (se existir)

5. **Execute o projeto**
   ```bash
   npm run dev
   ```

6. **Acesse a aplicação**
   
   Abra [http://localhost:5173](http://localhost:5173) no navegador

## 📁 Estrutura do Projeto

```
crm-marketing/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de UI (botões, cards, etc)
│   └── ...             # Outros componentes
├── pages/               # Páginas da aplicação
├── lib/                 # Utilitários e configurações
│   └── supabase.ts     # Cliente Supabase
├── context/             # Contextos React
├── .env.example        # Exemplo de variáveis de ambiente
├── .gitignore          # Arquivos ignorados pelo Git
├── package.json        # Dependências do projeto
└── README.md           # Este arquivo
```

## 🗄️ Estrutura do Banco de Dados

O projeto utiliza as seguintes tabelas no Supabase:

- `contacts` - Contatos/Leads
- `deals` - Negócios do pipeline
- `contracts` - Contratos
- `quizzes` - Quizzes criados
- `quiz_questions` - Perguntas dos quizzes
- `quiz_options` - Opções de resposta
- `quiz_responses` - Respostas dos usuários
- `quiz_answers` - Respostas individuais
- `activities` - Atividades registradas
- `profiles` - Perfis de usuário

## 🔐 Segurança

- **RLS (Row Level Security)**: Todas as tabelas têm políticas RLS habilitadas
- **Autenticação**: Sistema de login/registro via Supabase Auth
- **Variáveis de Ambiente**: Credenciais sensíveis não são commitadas

## 🚨 Solução de Problemas

### Tela cinza/branca ao abrir

1. **Verifique as variáveis de ambiente**
   - Certifique-se de que o arquivo `.env` existe e está configurado corretamente
   - Verifique o console do navegador para erros

2. **Verifique o console do navegador**
   - Abra as ferramentas de desenvolvedor (F12)
   - Veja se há erros no console

3. **Reinstale as dependências**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **Limpe o cache do Vite**
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Erro de autenticação

- Verifique se as credenciais do Supabase estão corretas
- Certifique-se de que o projeto Supabase está ativo
- Verifique se as políticas RLS estão configuradas corretamente

### Erro "Failed to fetch" no deploy

Este erro geralmente ocorre quando as variáveis de ambiente não estão configuradas na plataforma de hospedagem.

**📘 Guia Completo de Deploy:**
- Veja o arquivo `DEPLOY_VERCEL.md` para instruções detalhadas de deploy na Vercel
- Veja o arquivo `GUIA_SUPABASE.md` para obter as credenciais do Supabase

**Resumo rápido para Vercel:**
1. No dashboard da Vercel, vá em **Settings** > **Environment Variables**
2. Adicione:
   - `VITE_SUPABASE_URL` = sua URL do Supabase
   - `VITE_SUPABASE_ANON_KEY` = sua chave anon
3. Selecione todas as opções (Production, Preview, Development)
4. **IMPORTANTE**: Após adicionar, vá em **Deployments** e faça um **Redeploy**

**Para Netlify:**
1. Vá em Site settings > Environment variables
2. Adicione `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`
3. Faça um novo deploy

**Para outras plataformas:**
- Configure as variáveis de ambiente na seção de configurações do seu projeto
- Certifique-se de que as variáveis começam com `VITE_` para serem incluídas no build
- Após configurar, faça um novo build e deploy

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

Desenvolvido com ❤️ para StartinOS

---

**Nota**: Este é um projeto em desenvolvimento. Algumas funcionalidades podem estar em fase de implementação.
