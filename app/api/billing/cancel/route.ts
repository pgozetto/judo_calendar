import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });

  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  if (!subscription?.provider_subscription_id || subscription.status !== "authorized") {
    return NextResponse.json({ error: "Não há assinatura recorrente ativa." }, { status: 409 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Pagamento não configurado." }, { status: 503 });
  const response = await fetch(`https://api.mercadopago.com/preapproval/${subscription.provider_subscription_id}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ status: "cancelled" }),
  });
  if (!response.ok) return NextResponse.json({ error: "O Mercado Pago não confirmou o cancelamento." }, { status: 502 });

  await createAdminClient().from("subscriptions").update({ status: "cancelled", cancel_at_period_end: true }).eq("id", subscription.id);
  return NextResponse.json({ ok: true });
}
