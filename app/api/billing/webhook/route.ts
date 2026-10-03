import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export const runtime = "nodejs";

type WebhookBody = {
  id?: string | number;
  type?: string;
  action?: string;
  data?: { id?: string | number };
};

const MAX_SIGNATURE_AGE_MS = 10 * 60 * 1000;

function verifySignature(request: NextRequest, dataId: string) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const signature = request.headers.get("x-signature");
  const requestId = request.headers.get("x-request-id");
  if (!secret || !signature || !requestId) return false;

  const parts = Object.fromEntries(signature.split(",").map((part) => part.trim().split("=", 2)));
  if (!parts.ts || !parts.v1) return false;

  // Rejeita notificações antigas reenviadas por terceiros (replay).
  const timestamp = Number(parts.ts);
  const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > MAX_SIGNATURE_AGE_MS) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${parts.ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  const actualBuffer = Buffer.from(parts.v1);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

function mapSubscriptionStatus(value: string) {
  const statuses = {
    authorized: "authorized",
    pending: "pending",
    paused: "paused",
    cancelled: "cancelled",
  } as const;
  return statuses[value as keyof typeof statuses] ?? "payment_failed";
}

async function fetchMercadoPago(path: string, accessToken: string) {
  const response = await fetch(`https://api.mercadopago.com${path}`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!response.ok) throw new Error(`Recurso do Mercado Pago indisponível (${response.status}).`);
  return await response.json() as Record<string, unknown>;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as WebhookBody | null;
  const dataId = String(request.nextUrl.searchParams.get("data.id") ?? body?.data?.id ?? "");
  if (!dataId || !verifySignature(request, dataId)) {
    return NextResponse.json({ error: "Assinatura do webhook inválida." }, { status: 401 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) return NextResponse.json({ error: "Integração indisponível." }, { status: 503 });

  const eventType = String(body?.type ?? body?.action ?? "unknown");
  const eventId = String(body?.id ?? request.headers.get("x-request-id") ?? dataId);
  const admin = createAdminClient();
  const { data: event, error: eventError } = await admin.from("payment_events").upsert({
    provider: "mercado_pago",
    provider_event_id: eventId,
    event_type: eventType,
    payload: (body ?? {}) as Json,
  }, { onConflict: "provider,provider_event_id,event_type", ignoreDuplicates: true }).select("id,processed_at").maybeSingle();

  if (eventError) return NextResponse.json({ error: "Falha ao registrar evento." }, { status: 500 });
  if (event?.processed_at) return NextResponse.json({ ok: true, duplicate: true });

  try {
    // Cobranças mensais chegam como "subscription_authorized_payment" e apontam
    // para a assinatura (preapproval) que precisa ser consultada.
    let preapprovalId: string | null = null;
    if (eventType === "subscription_authorized_payment") {
      const authorizedPayment = await fetchMercadoPago(`/authorized_payments/${encodeURIComponent(dataId)}`, accessToken);
      preapprovalId = typeof authorizedPayment.preapproval_id === "string" ? authorizedPayment.preapproval_id : null;
      if (!preapprovalId) throw new Error("Cobrança recorrente sem assinatura vinculada.");
    } else if (eventType.includes("subscription") || eventType === "preapproval") {
      preapprovalId = dataId;
    }

    const resource = preapprovalId
      ? await fetchMercadoPago(`/preapproval/${encodeURIComponent(preapprovalId)}`, accessToken)
      : await fetchMercadoPago(`/v1/payments/${encodeURIComponent(dataId)}`, accessToken);
    const externalReference = String(resource.external_reference ?? "");
    const [userId, planId] = externalReference.split(":");
    if (!userId || !planId) throw new Error("Referência externa inválida.");

    const [{ data: current }, { data: plan }] = await Promise.all([
      admin.from("subscriptions").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("subscription_plans").select("*").eq("id", planId).maybeSingle(),
    ]);
    if (!current || !plan) throw new Error("Assinatura ou plano não encontrado.");

    if (preapprovalId) {
      // Eventos atrasados da mensalidade não podem sobrescrever um acesso vitalício.
      if (!current.lifetime_access) {
        const status = mapSubscriptionStatus(String(resource.status ?? ""));
        await admin.from("subscriptions").update({
          plan_id: "pro_monthly",
          provider: "mercado_pago",
          provider_subscription_id: String(resource.id ?? preapprovalId),
          status,
          current_period_start: typeof resource.date_created === "string" ? resource.date_created : null,
          current_period_end: typeof resource.next_payment_date === "string" ? resource.next_payment_date : current.current_period_end,
          lifetime_access: false,
          metadata: resource as Json,
        }).eq("user_id", userId);
        if (status === "authorized" && current.status !== "authorized") {
          await admin.from("notifications").insert({ user_id: userId, title: "Plano Pró ativado", body: "Seu acesso aos recursos Pró já está disponível.", kind: "billing", href: "/app" });
        }
      }
    } else {
      const approved = resource.status === "approved";
      const paidAmount = Number(resource.transaction_amount ?? 0);
      const paidEnough = resource.currency_id === plan.currency && paidAmount * 100 >= plan.price_cents;
      if (planId === "founder_lifetime" && approved && paidEnough && !current.lifetime_access) {
        // Quem migra da mensalidade para o vitalício não deve continuar sendo cobrado.
        if (current.provider_subscription_id && current.status === "authorized") {
          await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(current.provider_subscription_id)}`, {
            method: "PUT",
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ status: "cancelled" }),
          });
        }
        await admin.from("subscriptions").update({
          plan_id: "founder_lifetime",
          provider: "mercado_pago",
          provider_subscription_id: null,
          provider_payment_id: String(resource.id ?? dataId),
          status: "authorized",
          lifetime_access: true,
          current_period_start: typeof resource.date_approved === "string" ? resource.date_approved : new Date().toISOString(),
          current_period_end: null,
          metadata: resource as Json,
        }).eq("user_id", userId);
        await admin.from("notifications").insert({ user_id: userId, title: "Acesso vitalício ativado", body: "Bem-vindo ao grupo de membros fundadores do Judo Calendar.", kind: "billing", href: "/app" });
      } else if (planId === "founder_lifetime" && approved && !paidEnough) {
        throw new Error("Valor pago diferente do preço do plano.");
      }
    }

    if (event?.id) await admin.from("payment_events").update({ processed_at: new Date().toISOString(), processing_error: null }).eq("id", event.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (event?.id) await admin.from("payment_events").update({ processing_error: error instanceof Error ? error.message : "Erro desconhecido" }).eq("id", event.id);
    return NextResponse.json({ error: "Evento registrado para nova tentativa." }, { status: 500 });
  }
}
