"use client";

import { ArrowLeft, Check, Crown, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

const offers = [
  { id: "pro_monthly" as const, name: "Pró Mensal", price: "R$ 20/mês", description: "Biblioteca, competições e revisões por e-mail.", features: ["Todos os recursos Pró", "Cancele quando quiser", "Alertas de competições"] },
  { id: "founder_lifetime" as const, name: "Fundador Vitalício", price: "R$ 150", description: "Pagamento único e acesso Pró vitalício.", features: ["Pagamento único", "Atualizações futuras", "Selo de membro fundador"] },
];

export function BillingPage({ currentPlan, recurringActive }: { currentPlan: string; recurringActive: boolean }) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function checkout(plan: "pro_monthly" | "founder_lifetime") {
    setLoading(plan);
    setMessage("");
    const response = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan }) });
    const result = await response.json() as { url?: string; error?: string };
    if (response.ok && result.url) window.location.assign(result.url);
    else {
      setMessage(result.error ?? "Não foi possível abrir o pagamento.");
      setLoading(null);
    }
  }

  async function cancel() {
    setLoading("cancel");
    const response = await fetch("/api/billing/cancel", { method: "POST" });
    const result = await response.json() as { error?: string };
    setMessage(response.ok ? "Assinatura cancelada. O status será atualizado no painel." : result.error ?? "Não foi possível cancelar.");
    setLoading(null);
  }

  return <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 text-stone-950 dark:bg-[#100e0c] dark:text-stone-50 sm:px-8"><header className="mx-auto flex max-w-6xl items-center justify-between"><Brand /><div className="flex items-center gap-2"><Link href="/app" className="hidden items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-extrabold sm:flex dark:border-white/10 dark:bg-white/5"><ArrowLeft className="size-4" /> Voltar ao dojo</Link><ThemeToggle /></div></header><section className="mx-auto max-w-5xl py-16"><div className="mx-auto max-w-2xl text-center"><p className="text-xs font-black uppercase tracking-[.16em] text-red-700 dark:text-amber-400">Pagamento seguro</p><h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">Escolha seu acesso ao Pró.</h1><p className="mt-4 text-stone-500 dark:text-stone-400">Plano atual: <strong>{currentPlan}</strong>. Você conclui o pagamento no ambiente protegido do Mercado Pago.</p></div>{message&&<p className="mx-auto mt-7 max-w-2xl rounded-xl bg-amber-50 p-4 text-center text-sm font-bold text-amber-900 dark:bg-amber-500/10 dark:text-amber-200">{message}</p>}<div className="mt-10 grid gap-5 md:grid-cols-2">{offers.map((offer,index)=><article key={offer.id} className={`relative rounded-[26px] border p-7 ${index===0?"border-red-300 bg-white shadow-xl shadow-red-100/40 dark:border-amber-500/25 dark:bg-white/[.035] dark:shadow-none":"border-stone-200 bg-white dark:border-white/10 dark:bg-white/[.035]"}`}>{index===0&&<span className="absolute -top-3 right-6 flex items-center gap-1 rounded-full bg-red-700 px-3 py-1.5 text-[10px] font-black uppercase text-white dark:bg-amber-500 dark:text-stone-950"><Crown className="size-3" /> Mais escolhido</span>}<h2 className="text-xl font-black">{offer.name}</h2><p className="mt-4 text-4xl font-black tracking-tight">{offer.price}</p><p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">{offer.description}</p><ul className="mt-6 space-y-3">{offer.features.map((feature)=><li key={feature} className="flex items-center gap-3 text-sm font-bold"><span className="grid size-5 place-items-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"><Check className="size-3" /></span>{feature}</li>)}</ul><button disabled={Boolean(loading)} onClick={()=>checkout(offer.id)} className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-red-700 text-sm font-extrabold text-white disabled:opacity-60 dark:bg-amber-500 dark:text-stone-950">{loading===offer.id?"Abrindo pagamento...":"Escolher este plano"}</button></article>)}</div>{recurringActive&&<button disabled={Boolean(loading)} onClick={cancel} className="mx-auto mt-7 block text-sm font-bold text-red-700 hover:underline disabled:opacity-60 dark:text-red-300">Cancelar assinatura mensal</button>}<p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-stone-400"><ShieldCheck className="size-4" /> Nenhum dado de cartão passa pelo Judo Calendar.</p></section></main>;
}
