# 💳 Guia de Configuração do Stripe

Este guia ajudará você a configurar a monetização no seu projeto usando Stripe e Supabase.

## 1️⃣ Configurar o Banco de Dados

1. Acesse o [Supabase Dashboard](https://app.supabase.com).
2. Vá para **SQL Editor**.
3. Copie o conteúdo do arquivo `migrations/20240522120000_subscription_setup.sql`.
4. Cole no editor e clique em **Run**.

Isso criará a tabela `profiles` e configurará as permissões necessárias.

## 2️⃣ Configurar o Stripe

1. Crie uma conta no [Stripe](https://stripe.com).
2. No Dashboard do Stripe, vá para **Produtos** e crie um novo produto "Plano Pro".
3. Defina o preço como **R$ 97,90** recorrente (mensal).
4. Após criar, copie o **Price ID** (começa com `price_...`).
5. Abra o arquivo `pages/Plans.tsx` e substitua `'price_123456789'` pelo seu Price ID real.

## 3️⃣ Deploy das Edge Functions

Você precisa implantar as funções que lidam com o checkout e webhooks.

Se você tiver a CLI do Supabase instalada:
```bash
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook --no-verify-jwt
```

*Nota: A flag `--no-verify-jwt` é necessária para o webhook pois o Stripe não envia o JWT do Supabase.*

Se não tiver a CLI, você pode copiar o código de `supabase/functions/stripe-checkout/index.ts` e `supabase/functions/stripe-webhook/index.ts` e criar as funções manualmente no dashboard do Supabase em **Edge Functions**.

## 4️⃣ Variáveis de Ambiente (Supabase)

No Dashboard do Supabase, vá em **Settings > Edge Functions** e adicione as seguintes variáveis:

- `STRIPE_SECRET_KEY`: Sua chave secreta do Stripe (começa com `sk_...`).
- `STRIPE_WEBHOOK_SECRET`: O segredo do webhook (obtido após configurar o endpoint do webhook no Stripe).
- `SUPABASE_URL`: URL do seu projeto.
- `SUPABASE_ANON_KEY`: Chave pública.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave de serviço (necessária para o webhook atualizar o banco).

## 5️⃣ Configurar Webhook no Stripe

1. No Stripe, vá em **Developers > Webhooks**.
2. Adicione um endpoint apontando para a URL da sua função `stripe-webhook`.
   - Exemplo: `https://<project-ref>.functions.supabase.co/stripe-webhook`
3. Selecione os eventos:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`

## 🚀 Pronto!

Agora seu sistema deve estar pronto para processar pagamentos.
- O usuário clica em "Assinar Pro".
- É redirecionado para o Stripe.
- Após pagar, volta para a aplicação.
- O Webhook atualiza o status no banco de dados para 'pro'.
