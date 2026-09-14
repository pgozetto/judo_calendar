import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const checkoutSchema = z.object({
  plan: z.enum(["pro_monthly", "founder_lifetime"]),
});

type MercadoPagoCheckout = { id: string; init_point?: string; sandbox_init_point?: string };

export async function POST(request: NextRequest) {
  const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Plano inválido." }, { status: 400 });

  const supabase = await createClient();
  const [{ data: claimsData }, { data: userData }] = await Promise.all([
    supabase.auth.getClaims(),
    supabase.auth.getUser(),
  ]);
  const userId = claimsData?.claims?.sub;
  const email = userData.user?.email;
  if (!userId || !email) return NextResponse.json({ error: "Faça login para continuar." }, { status: 401 });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json({ error: "Pagamento ainda não configurado pelo administrador." }, { status: 503 });
  }

  const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", parsed.data.plan).single();
  if (!plan) return NextResponse.json({ error: "Plano indisponível." }, { status: 404 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
  const notificationUrl = `${appUrl}/api/billing/webhook`;
  const externalReference = `${userId}:${plan.id}`;
  const recurring = plan.interval === "month";
  const endpoint = recurring ? "/preapproval" : "/checkout/preferences";
  const body = recurring
    ? {
        reason: `Judo Calendar - ${plan.name}`,
        external_reference: externalReference,
        payer_email: email,
        back_url: `${appUrl}/assinar?retorno=mercado-pago`,
        notification_url: notificationUrl,
        status: "pending",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: plan.price_cents / 100,
          currency_id: plan.currency,
        },
      }
    : {
        external_reference: externalReference,
        notification_url: notificationUrl,
        items: [{
          id: plan.id,
          title: `Judo Calendar - ${plan.name}`,
          description: plan.description,
          quantity: 1,
          currency_id: plan.currency,
          unit_price: plan.price_cents / 100,
        }],
        payer: { email },
        back_urls: {
          success: `${appUrl}/assinar?pagamento=sucesso`,
          pending: `${appUrl}/assinar?pagamento=pendente`,
          failure: `${appUrl}/assinar?pagamento=falhou`,
        },
        auto_return: "approved",
      };

  const response = await fetch(`https://api.mercadopago.com${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "O Mercado Pago recusou a criação do checkout." }, { status: 502 });
  }

  const checkout = await response.json() as MercadoPagoCheckout;
  const checkoutUrl = checkout.init_point ?? checkout.sandbox_init_point;
  if (!checkoutUrl) return NextResponse.json({ error: "O checkout não retornou um link válido." }, { status: 502 });

  const admin = createAdminClient();
  const { error: saveError } = await admin.from("subscriptions").update({
    plan_id: plan.id,
    provider: "mercado_pago",
    provider_subscription_id: recurring ? checkout.id : null,
    status: "pending",
    lifetime_access: false,
    metadata: { checkout_id: checkout.id, checkout_kind: recurring ? "subscription" : "one_time" },
  }).eq("user_id", userId);

  if (saveError) return NextResponse.json({ error: "Checkout criado, mas não foi possível registrar a cobrança." }, { status: 500 });
  return NextResponse.json({ url: checkoutUrl });
}
