import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingPage, type CheckoutReturn } from "@/components/billing-page";
import { hasProAccess } from "@/lib/billing";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Planos e pagamento" };

type SubscribePageProps = {
  searchParams: Promise<{ pagamento?: string | string[]; retorno?: string | string[]; plano?: string | string[] }>;
};

function checkoutReturn(pagamento: unknown, retorno: unknown): CheckoutReturn {
  if (pagamento === "sucesso" || retorno === "mercado-pago") return "success";
  if (pagamento === "pendente") return "pending";
  if (pagamento === "falhou") return "failure";
  return null;
}

export default async function SubscribePage({ searchParams }: SubscribePageProps) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/entrar?next=/assinar");

  const { pagamento, retorno, plano } = await searchParams;
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", subscription?.plan_id ?? "free").maybeSingle();
  const paid = hasProAccess(subscription, plan);

  return (
    <BillingPage
      currentPlan={paid ? plan?.name ?? "Gratuito" : "Gratuito"}
      paid={paid}
      lifetime={paid && Boolean(subscription?.lifetime_access)}
      recurringActive={subscription?.status === "authorized" && subscription.plan_id === "pro_monthly"}
      selectedPlan={plano === "founder_lifetime" ? "founder_lifetime" : plano === "pro_monthly" ? "pro_monthly" : null}
      returnStatus={checkoutReturn(pagamento, retorno)}
    />
  );
}
