"use client";

import { ArrowLeft, Check, CircleCheck, Clock3, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

type OfferId = "pro_monthly" | "founder_lifetime";
export type CheckoutReturn = "success" | "pending" | "failure" | null;

const offers: { id: OfferId; name: string; price: string; suffix: string; description: string; features: string[] }[] = [
  { id: "pro_monthly", name: "Pró Mensal", price: "R$ 34,90", suffix: "/mês", description: "Biblioteca, competições e revisões por e-mail.", features: ["Todos os recursos Pró", "Cancele quando quiser", "Alertas de competições"] },
  { id: "founder_lifetime", name: "Fundador Vitalício", price: "R$ 110,90", suffix: "uma vez", description: "Pagamento único e acesso Pró para sempre.", features: ["Pagamento único", "Atualizações futuras", "Selo de membro fundador"] },
];

const returnMessages = {
  success: { icon: CircleCheck, tone: "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200", text: "Pagamento recebido. Seu acesso Pró é liberado assim que o Mercado Pago confirmar, normalmente em poucos segundos." },
  pending: { icon: Clock3, tone: "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200", text: "Pagamento em análise. Avisaremos no app quando for aprovado; boletos podem levar até 2 dias úteis." },
  failure: { icon: TriangleAlert, tone: "border-red-200 bg-red-50 text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200", text: "O pagamento não foi concluído e nada foi cobrado. Tente novamente ou escolha outra forma de pagamento." },
} as const;

type BillingPageProps = {
  currentPlan: string;
  paid: boolean;
  lifetime: boolean;
  recurringActive: boolean;
  selectedPlan: OfferId | null;
  returnStatus: CheckoutReturn;
};

export function BillingPage({ currentPlan, paid, lifetime, recurringActive, selectedPlan, returnStatus }: BillingPageProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(false);
  const highlighted = selectedPlan ?? "pro_monthly";
  const notice = returnStatus && !paid ? returnMessages[returnStatus] : null;
  const available = offers.filter((offer) => !(recurringActive && offer.id === "pro_monthly"));

  async function checkout(plan: OfferId) {
    setLoading(plan);
    setMessage("");
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
      const result = await response.json().catch(() => ({})) as { url?: string; error?: string };
      if (response.ok && result.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage(result.error ?? "Não foi possível abrir o pagamento. Tente novamente.");
    } catch {
      setMessage("Sem conexão com o servidor. Verifique sua internet e tente novamente.");
    }
    setLoading(null);
  }

  async function cancel() {
    setLoading("cancel");
    try {
      const response = await fetch("/api/billing/cancel", { method: "POST" });
      const result = await response.json().catch(() => ({})) as { error?: string };
      setMessage(response.ok ? "Assinatura cancelada. Você mantém o Pró até o fim do período já pago." : result.error ?? "Não foi possível cancelar.");
    } catch {
      setMessage("Sem conexão com o servidor. Tente novamente.");
    }
    setConfirmCancel(false);
    setLoading(null);
  }

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-4 py-5 text-stone-950 sm:px-8 dark:bg-[#100e0c] dark:text-stone-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Brand href="/app" />
        <div className="flex items-center gap-2">
          <Link href="/app" className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-bold text-stone-600 transition-colors hover:bg-white hover:text-stone-950 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-stone-50"><ArrowLeft className="size-4" /> <span className="hidden sm:inline">Voltar ao dojo</span></Link>
          <ThemeToggle />
        </div>
      </header>

      <section className="mx-auto max-w-4xl py-12 sm:py-16">
        <h1 className="text-balance text-4xl font-black tracking-[-.04em] sm:text-5xl">{lifetime ? "Você é membro fundador." : paid ? "Seu Pró está ativo." : "Libere o Judo Calendar completo."}</h1>
        <p className="mt-4 max-w-xl text-[17px] leading-7 text-stone-600 dark:text-stone-400">
          Plano atual: <strong className="text-stone-950 dark:text-stone-50">{currentPlan}</strong>.{" "}
          {lifetime ? "Todos os recursos Pró estão liberados para sempre." : "O pagamento é feito no ambiente protegido do Mercado Pago."}
        </p>

        {notice && <p role="status" className={`mt-8 flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold leading-6 ${notice.tone}`}><notice.icon className="mt-0.5 size-5 shrink-0" />{notice.text}</p>}
        {message && <p role="status" aria-live="polite" className="mt-8 rounded-xl border border-stone-200 bg-white p-4 text-sm font-semibold dark:border-white/10 dark:bg-white/5">{message}</p>}

        {!lifetime && (
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {available.map((offer) => {
              const featured = offer.id === highlighted;
              return (
                <article key={offer.id} className={`flex flex-col rounded-2xl border bg-white p-7 dark:bg-white/[.03] ${featured ? "border-red-700 ring-1 ring-red-700 dark:border-amber-500 dark:ring-amber-500" : "border-stone-200 dark:border-white/10"}`}>
                  <h2 className="text-lg font-black">{offer.name}</h2>
                  <p className="mt-4 flex items-baseline gap-2"><span className="text-4xl font-black tracking-[-.04em] tabular-nums">{offer.price}</span><span className="text-sm font-semibold text-stone-500 dark:text-stone-400">{offer.suffix}</span></p>
                  <p className="mt-3 text-sm leading-6 text-stone-600 dark:text-stone-400">{offer.description}</p>
                  <ul className="mt-6 flex-1 space-y-3 border-t border-stone-200 pt-6 dark:border-white/10">
                    {offer.features.map((feature) => <li key={feature} className="flex items-center gap-3 text-sm font-semibold"><Check className="size-4 text-red-700 dark:text-amber-400" />{feature}</li>)}
                  </ul>
                  <button type="button" disabled={Boolean(loading)} onClick={() => checkout(offer.id)} className={`mt-8 flex h-12 w-full items-center justify-center rounded-xl text-sm font-extrabold transition-colors disabled:cursor-wait disabled:opacity-60 ${featured ? "bg-red-700 text-white hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400" : "border border-stone-300 hover:bg-stone-50 dark:border-white/15 dark:hover:bg-white/5"}`}>
                    {loading === offer.id ? "Abrindo o Mercado Pago..." : offer.id === "founder_lifetime" && recurringActive ? "Trocar mensal pelo vitalício" : "Escolher este plano"}
                  </button>
                </article>
              );
            })}
          </div>
        )}

        {recurringActive && (
          <div className="mt-8 flex flex-col gap-3 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between dark:border-white/10">
            <p className="text-sm text-stone-600 dark:text-stone-400">{confirmCancel ? "Cancelar a renovação? Você mantém o Pró até o fim do período pago." : "Assinatura mensal com renovação automática."}</p>
            <div className="flex gap-2">
              {confirmCancel && <button type="button" onClick={() => setConfirmCancel(false)} className="rounded-lg px-4 py-2.5 text-sm font-bold text-stone-600 hover:bg-white dark:text-stone-300 dark:hover:bg-white/5">Manter</button>}
              <button type="button" disabled={Boolean(loading)} onClick={() => confirmCancel ? cancel() : setConfirmCancel(true)} className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-50 disabled:opacity-60 dark:border-red-500/25 dark:text-red-300 dark:hover:bg-red-500/10">{loading === "cancel" ? "Cancelando..." : confirmCancel ? "Confirmar cancelamento" : "Cancelar assinatura"}</button>
            </div>
          </div>
        )}

        <p className="mt-10 flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400"><ShieldCheck className="size-4" /> Nenhum dado de cartão passa pelos servidores do Judo Calendar.</p>
      </section>
    </main>
  );
}
