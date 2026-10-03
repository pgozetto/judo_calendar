import type { Tables } from "@/lib/database.types";

type SubscriptionAccess = Pick<Tables<"subscriptions">, "status" | "lifetime_access" | "current_period_end">;
type PlanAccess = Pick<Tables<"subscription_plans">, "pro_access">;

// Espelha public.has_pro_access(): só pagamento confirmado libera o Pró.
// Uma assinatura cancelada continua valendo até o fim do período já pago.
export function hasProAccess(subscription: SubscriptionAccess | null | undefined, plan: PlanAccess | null | undefined) {
  if (!subscription) return false;
  if (subscription.status === "authorized") return subscription.lifetime_access || Boolean(plan?.pro_access);
  if (subscription.status === "cancelled" && plan?.pro_access && subscription.current_period_end) {
    return new Date(subscription.current_period_end).getTime() > Date.now();
  }
  return false;
}
