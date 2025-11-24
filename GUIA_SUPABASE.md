# 📘 Guia Completo: Como Obter Credenciais do Supabase

Este guia mostra passo a passo como obter as credenciais necessárias para configurar o projeto.

## 🎯 O que você precisa

- `VITE_SUPABASE_URL` - URL do seu projeto Supabase
- `VITE_SUPABASE_ANON_KEY` - Chave pública anônima do Supabase

## 📝 Passo a Passo Detalhado

### 1️⃣ Criar Conta e Projeto no Supabase

1. Acesse [https://app.supabase.com](https://app.supabase.com)
2. Clique em **"Sign Up"** ou **"Start your project"** se não tiver conta
3. Faça login com GitHub, Google ou email
4. Clique em **"New Project"**
5. Preencha os dados:
   - **Name**: Nome do seu projeto (ex: "CRM Marketing")
   - **Database Password**: Crie uma senha forte (guarde em local seguro!)
   - **Region**: Escolha a região mais próxima (ex: "South America (São Paulo)")
   - **Pricing Plan**: Escolha "Free" para começar
6. Clique em **"Create new project"**
7. Aguarde 2-3 minutos enquanto o projeto é criado

### 2️⃣ Acessar as Configurações da API

1. Após o projeto ser criado, você será redirecionado para o dashboard
2. No menu lateral esquerdo, procure por **"Settings"** (ícone de engrenagem ⚙️)
3. Clique em **"Settings"**
4. No submenu que aparece, clique em **"API"**

### 3️⃣ Encontrar e Copiar as Credenciais

Na página de API, você verá várias seções:

#### 📍 Project URL
- Procure pela seção **"Project URL"** ou **"Project URL"**
- Você verá algo como: `https://abcdefghijklmnop.supabase.co`
- Clique no ícone de **cópia** 📋 ao lado da URL
- Esta é sua `VITE_SUPABASE_URL`

#### 🔑 API Keys
- Procure pela seção **"Project API keys"** ou **"API Keys"**
- Você verá várias chaves listadas:
  - **`anon`** ou **`public`** ← **USE ESTA!**
  - `service_role` ← NÃO use esta no frontend!
- Clique no ícone de **olho** 👁️ ao lado da chave `anon` para revelá-la
- Clique no ícone de **cópia** 📋 para copiar
- Esta é sua `VITE_SUPABASE_ANON_KEY`

### 4️⃣ Configurar no Projeto

1. No seu projeto local, crie ou edite o arquivo `.env` na raiz:
   ```bash
   # Windows
   notepad .env
   
   # Linux/Mac
   nano .env
   ```

2. Cole as credenciais no formato:
   ```env
   VITE_SUPABASE_URL=https://seu-projeto-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo...
   ```

3. **Importante**: Substitua pelos valores reais que você copiou!

4. Salve o arquivo

5. Reinicie o servidor de desenvolvimento:
   ```bash
   # Pare o servidor (Ctrl+C) e inicie novamente
   npm run dev
   ```

## 🖼️ Visualização da Interface

A página de API do Supabase tem esta estrutura:

```
┌─────────────────────────────────────┐
│  Settings > API                     │
├─────────────────────────────────────┤
│                                     │
│  Project URL                        │
│  ┌─────────────────────────────┐   │
│  │ https://xxxxx.supabase.co    │ 📋│
│  └─────────────────────────────┘   │
│                                     │
│  Project API keys                   │
│  ┌─────────────────────────────┐   │
│  │ anon / public               │ 👁️│
│  │ eyJhbGciOiJIUzI1NiIsInR5... │ 📋│
│  └─────────────────────────────┘   │
│                                     │
│  service_role (secret)              │
│  ┌─────────────────────────────┐   │
│  │ ⚠️ NÃO USE NO FRONTEND      │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

## ✅ Verificar se Está Funcionando

1. Inicie o projeto: `npm run dev`
2. Abra o navegador no console (F12)
3. Se você ver o aviso "⚠️ Missing Supabase environment variables!", as variáveis não estão configuradas
4. Se não aparecer o aviso e o login funcionar, está tudo certo! ✅

## 🚨 Problemas Comuns

### "Failed to fetch" ou "ERR_NAME_NOT_RESOLVED"
- **Causa**: URL do Supabase incorreta ou variáveis não configuradas
- **Solução**: Verifique se copiou a URL completa e se o arquivo `.env` está na raiz do projeto

### "Invalid API key"
- **Causa**: Chave anon incorreta ou copiou a chave service_role por engano
- **Solução**: Use a chave `anon` ou `public`, nunca a `service_role`

### Variáveis não são reconhecidas
- **Causa**: Servidor não foi reiniciado após criar o `.env`
- **Solução**: Pare o servidor (Ctrl+C) e execute `npm run dev` novamente

## 📚 Recursos Adicionais

- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Autenticação](https://supabase.com/docs/guides/auth)
- [Configuração de RLS](https://supabase.com/docs/guides/auth/row-level-security)

## 💡 Dica

Se você já tem um projeto Supabase, pode pular a etapa 1 e ir direto para as configurações da API!

---

**Pronto!** Agora você tem todas as informações necessárias para configurar o projeto. 🎉

