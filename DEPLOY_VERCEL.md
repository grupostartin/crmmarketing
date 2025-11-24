# 🚀 Guia de Deploy na Vercel

Este guia mostra como fazer deploy do projeto na Vercel e configurar as variáveis de ambiente.

## 📋 Pré-requisitos

1. Conta no [Vercel](https://vercel.com) (gratuita)
2. Projeto no GitHub (ou GitLab/Bitbucket)
3. Credenciais do Supabase já obtidas

## 🔧 Passo a Passo

### 1️⃣ Preparar o Projeto

1. Certifique-se de que o projeto está no GitHub:
   ```bash
   git add .
   git commit -m "Preparar para deploy"
   git push origin main
   ```

2. Verifique se o arquivo `.env` está no `.gitignore` (não deve ser commitado)

### 2️⃣ Conectar com Vercel

1. Acesse [https://vercel.com](https://vercel.com)
2. Faça login com GitHub, GitLab ou Bitbucket
3. Clique em **"Add New..."** > **"Project"**
4. Importe seu repositório do GitHub
5. Selecione o repositório do projeto

### 3️⃣ Configurar o Projeto

Na tela de configuração do projeto:

1. **Framework Preset**: Vercel deve detectar automaticamente "Vite"
2. **Root Directory**: Deixe como está (geralmente `./`)
3. **Build Command**: `npm run build` (já vem preenchido)
4. **Output Directory**: `dist` (já vem preenchido)
5. **Install Command**: `npm install` (já vem preenchido)

### 4️⃣ ⚠️ CONFIGURAR VARIÁVEIS DE AMBIENTE (IMPORTANTE!)

**ANTES de clicar em "Deploy", configure as variáveis:**

1. Na mesma tela de configuração, procure por **"Environment Variables"**
2. Clique para expandir essa seção
3. Adicione as duas variáveis:

   **Primeira variável:**
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Cole a URL do seu projeto Supabase
     - Exemplo: `https://abcdefghijklmnop.supabase.co`
   - **Environment**: Selecione todas as opções:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
   - Clique em **"Add"**

   **Segunda variável:**
   - **Name**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Cole a chave anon do Supabase
     - Exemplo: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Environment**: Selecione todas as opções:
     - ☑️ Production
     - ☑️ Preview
     - ☑️ Development
   - Clique em **"Add"**

4. **IMPORTANTE**: Verifique se ambas as variáveis foram adicionadas corretamente

### 5️⃣ Fazer o Deploy

1. Após configurar as variáveis, clique em **"Deploy"**
2. Aguarde o build (geralmente 1-2 minutos)
3. Quando terminar, você verá uma URL do tipo: `https://seu-projeto.vercel.app`

### 6️⃣ Verificar se Funcionou

1. Acesse a URL fornecida pela Vercel
2. Se você **NÃO** ver o aviso de "Variáveis de Ambiente Não Configuradas", está funcionando! ✅
3. Tente fazer login

## 🔄 Atualizar Variáveis de Ambiente (se necessário)

Se você precisar atualizar as variáveis depois:

1. No dashboard da Vercel, vá em **Settings** do seu projeto
2. Clique em **Environment Variables**
3. Edite ou adicione novas variáveis
4. **IMPORTANTE**: Após alterar, faça um novo deploy:
   - Vá em **Deployments**
   - Clique nos três pontos (...) do último deployment
   - Selecione **"Redeploy"**

## 🐛 Solução de Problemas

### Ainda aparece "Variáveis de Ambiente Não Configuradas"

**Causas possíveis:**
1. Variáveis não foram adicionadas antes do primeiro deploy
2. Variáveis foram adicionadas mas o deploy não foi refeito
3. Nomes das variáveis estão incorretos (devem ser exatamente `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`)

**Solução:**
1. Vá em Settings > Environment Variables
2. Verifique se as variáveis estão lá
3. Se estiverem, faça um **Redeploy**:
   - Deployments > ... > Redeploy
4. Se não estiverem, adicione-as e faça um novo deploy

### Erro "Failed to fetch" no login

**Causa**: URL ou chave do Supabase incorretas

**Solução:**
1. Verifique se copiou a URL completa (deve terminar com `.supabase.co`)
2. Verifique se copiou a chave `anon` completa (é muito longa)
3. Atualize as variáveis na Vercel e faça redeploy

### Build falha

**Causas possíveis:**
1. Erros de TypeScript
2. Dependências faltando

**Solução:**
1. Teste localmente primeiro: `npm run build`
2. Se funcionar localmente, verifique os logs do build na Vercel
3. Corrija os erros e faça push novamente

## 📝 Checklist de Deploy

Antes de fazer deploy, verifique:

- [ ] Projeto está no GitHub/GitLab
- [ ] `.env` está no `.gitignore` (não commitado)
- [ ] Você tem as credenciais do Supabase
- [ ] Variáveis de ambiente foram adicionadas na Vercel
- [ ] Build funciona localmente (`npm run build`)

## 🎯 Dicas

1. **Sempre configure as variáveis ANTES do primeiro deploy**
2. **Use a chave `anon`, nunca a `service_role`**
3. **Após alterar variáveis, sempre faça redeploy**
4. **Teste localmente primeiro** para evitar problemas

## 🔗 Links Úteis

- [Documentação da Vercel](https://vercel.com/docs)
- [Variáveis de Ambiente na Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase](https://app.supabase.com)

---

**Pronto!** Seu projeto deve estar funcionando na Vercel! 🎉

