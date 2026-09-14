# Judo Calendar

O **Judo Calendar** é um SaaS para judocas registrarem treinos, organizarem o plano de jogo e acompanharem a própria evolução. O projeto reúne diário de treino, calendário, notas, biblioteca técnica, competições e configurações da conta em uma experiência responsiva.

## Aplicação publicada

- Site: [judo-calendar-pedro.pgozetto.chatgpt.site](https://judo-calendar-pedro.pgozetto.chatgpt.site)
- Repositório: [github.com/pgozetto/judo_calendar](https://github.com/pgozetto/judo_calendar)

## Principais recursos

- cadastro, login, logout e recuperação de senha com Supabase Auth;
- provisionamento automático do perfil após o primeiro acesso;
- registros de treino com intensidade, aprendizados, erros e próximo foco;
- calendário mensal e exportação de competições em `.ics`;
- plano de jogo, notas livres e biblioteca de técnicas;
- calendário oficial da FPJUDO e alertas de competições;
- configurações de perfil, foto, senha e preferências de e-mail;
- planos gratuito e Pró, com integração de cobrança preparada;
- tema claro/escuro e layout adaptado para celular e computador;
- Row Level Security para separar os dados de cada usuário.

## Tecnologias

- Next.js 16, React 19 e TypeScript;
- Tailwind CSS 4 e Lucide React;
- Supabase Auth, PostgreSQL, Storage e RLS;
- Resend para e-mails transacionais e lembretes;
- Mercado Pago para assinaturas.

## Como executar localmente

Requisitos: Node.js 22 ou superior e um projeto no Supabase.

1. Instale as dependências:

```bash
npm install
```

2. Copie `.env.example` para `.env.local` e preencha, no mínimo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Aplique as migrações do banco:

```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF
npx supabase db push
```

4. Inicie o projeto:

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000).

## Variáveis opcionais

As integrações abaixo só são necessárias quando suas respectivas funções forem ativadas:

```env
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=

RESEND_API_KEY=
EMAIL_FROM=
CRON_SECRET=

MERCADOPAGO_ACCESS_TOKEN=
MERCADOPAGO_WEBHOOK_SECRET=
```

Nunca use o prefixo `NEXT_PUBLIC_` em chaves administrativas ou segredos.

## Rotas principais

| Rota | Função |
| --- | --- |
| `/` | Apresentação do produto e planos |
| `/entrar` e `/cadastro` | Autenticação |
| `/recuperar-senha` e `/redefinir-senha` | Recuperação de acesso |
| `/app` | Área privada do judoca |
| `/assinar` | Assinatura e cancelamento |
| `/api/calendar/competitions.ics` | Exportação do calendário |
| `/api/fpjudo/calendar` | Calendário oficial mais recente |
| `/api/cron/fpjudo` | Sincronização da FPJUDO |
| `/api/cron/reminders` | Envio de lembretes |
| `/api/billing/webhook` | Confirmação de pagamentos |

## Configuração do Supabase

No painel do Supabase:

- adicione a URL pública em **Authentication → URL Configuration**;
- autorize os retornos `/auth/callback` e `/redefinir-senha`;
- configure Google e GitHub em **Authentication → Providers**, se desejar login social;
- aplique todas as migrações da pasta `supabase/migrations`.

A migração `20260914010000_ensure_user_workspace.sql` recupera contas antigas que tenham sido criadas antes do provisionamento automático do perfil.

## Verificação antes de publicar

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Licença

Todos os direitos reservados a Pedro Gozetto.
