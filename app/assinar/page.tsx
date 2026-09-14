import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BillingPage } from "@/components/billing-page";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Planos e pagamento" };

export default async function SubscribePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/entrar?next=/assinar");

  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", userId).maybeSingle();
  const { data: plan } = await supabase.from("subscription_plans").select("*").eq("id", subscription?.plan_id ?? "free").maybeSingle();
  return <BillingPage currentPlan={plan?.name ?? "Gratuito"} recurringActive={subscription?.status === "authorized" && subscription.plan_id === "pro_monthly"} />;
}
