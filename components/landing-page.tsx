import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  ImagePlus,
  NotebookPen,
  ShieldCheck,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import { Brand } from "./brand";
import { LandingNav } from "./landing-nav";

const features = [
  { icon: CalendarDays, title: "Diário no calendário", description: "Toque no dia, registre o treino e veja sua evolução semana a semana." },
  { icon: Swords, title: "Plano de jogo", description: "Pegada, entrada, sequência e ne-waza organizados antes de pisar no tatame." },
  { icon: NotebookPen, title: "Notas livres", description: "Ajustes, ideias, metas e detalhes técnicos num espaço sem limite." },
  { icon: BookOpenCheck, title: "Biblioteca de golpes", description: "Modelos prontos por técnica, completados com as anotações do seu jogo.", pro: true },
  { icon: ImagePlus, title: "Vídeos e imagens", description: "Anexe a gravação do treino para rever exatamente o que precisa melhorar.", pro: true },
  { icon: BellRing, title: "Revisão por e-mail", description: "Resumo semanal e lembrete do plano de jogo antes de cada treino.", pro: true },
];

const steps = [
  { title: "Treine", copy: "Viva o treino por inteiro. Depois, abra o Judo Calendar enquanto a memória está fresca." },
  { title: "Registre", copy: "Anote acertos, erros, técnicas e sensações. Leva menos de três minutos." },
  { title: "Aplique", copy: "Revise o plano antes de voltar ao tatame e transforme observação em ação." },
];

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    description: "Para começar a registrar sua evolução.",
    features: ["Calendário de treinos", "Plano de jogo", "Notas livres", "Avisos pré-treino"],
    cta: "Começar grátis",
    href: "/cadastro",
  },
  {
    name: "Pró",
    price: "R$ 34,90",
    suffix: "/mês",
    description: "O sistema completo para competir melhor.",
    features: ["Tudo do Gratuito", "Biblioteca de golpes", "Vídeos e imagens", "Revisão semanal por e-mail", "Calendário FPJUDO"],
    cta: "Assinar o Pró",
    href: "/cadastro?plano=pro_monthly",
    featured: true,
  },
  {
    name: "Vitalício",
    price: "R$ 110,90",
    suffix: "uma vez",
    description: "Acesso completo, sem mensalidade.",
    features: ["Todos os recursos Pró", "Pagamento único", "Atualizações futuras", "Selo de membro fundador"],
    cta: "Garantir o vitalício",
    href: "/cadastro?plano=founder_lifetime",
  },
];

const competitions = [
  { date: "19–20 SET", title: "Inter-regional Aspirante", place: "Etapas por delegacia" },
  { date: "24–27 SET", title: "Troféu Brasil Júnior", place: "Individual e equipes" },
  { date: "26 SET", title: "Paulista Aspirante", place: "Marília · SP" },
];

function ProductPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[580px] lg:mx-0" aria-hidden="true">
      <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_24px_60px_-20px_rgba(40,25,16,.22)] dark:border-white/10 dark:bg-[#1a1714] dark:shadow-[0_24px_60px_-20px_rgba(0,0,0,.6)]">
        <div className="flex items-center gap-1.5 border-b border-stone-100 px-4 py-3 dark:border-white/[.07]">
          <span className="size-2.5 rounded-full bg-stone-200 dark:bg-white/15" /><span className="size-2.5 rounded-full bg-stone-200 dark:bg-white/15" /><span className="size-2.5 rounded-full bg-stone-200 dark:bg-white/15" />
        </div>
        <div className="grid grid-cols-[56px_1fr] sm:grid-cols-[150px_1fr]">
          <div className="border-r border-stone-100 p-3 sm:p-4 dark:border-white/[.07]">
            <Brand compact />
            <div className="mt-6 space-y-1">
              {[CalendarDays, Swords, NotebookPen, Trophy].map((Icon, index) => (
                <div key={index} className={`flex items-center gap-2.5 rounded-lg p-2.5 ${index === 0 ? "bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300" : "text-stone-400"}`}><Icon className="size-4 shrink-0" /><span className="hidden text-[11px] font-bold sm:block">{["Visão geral", "Plano de jogo", "Notas", "Competições"][index]}</span></div>
              ))}
            </div>
          </div>
          <div className="min-w-0 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-[11px] font-semibold text-stone-400">Domingo, 13 set</p><p className="mt-0.5 text-lg font-black tracking-tight sm:text-xl">Oss, bom treino!</p></div>
              <span className="rounded-md bg-red-700 px-2.5 py-1.5 text-[10px] font-bold text-white dark:bg-amber-500 dark:text-stone-950">+ Registrar</span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[{ v: "12", l: "treinos" }, { v: "8", l: "técnicas" }, { v: "4", l: "semanas" }].map((s) => <div key={s.l} className="rounded-lg bg-stone-50 p-2.5 dark:bg-white/5"><p className="text-base font-black tabular-nums">{s.v}</p><p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400">{s.l}</p></div>)}
            </div>
            <div className="mt-3 rounded-xl border border-stone-100 p-3 dark:border-white/[.07]">
              <div className="mb-2 flex items-center justify-between"><p className="text-[11px] font-extrabold">Setembro 2026</p><ChevronRight className="size-3.5 text-stone-400" /></div>
              <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-stone-400">{["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => <span key={i}>{d}</span>)}</div>
              <div className="mt-1.5 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tabular-nums">{Array.from({ length: 21 }, (_, i) => i + 1).map((d) => <span key={d} className={`grid aspect-square place-items-center rounded-md ${d === 13 ? "bg-red-700 font-black text-white dark:bg-amber-500 dark:text-stone-950" : [2, 5, 8, 10].includes(d) ? "bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300" : ""}`}>{d}</span>)}</div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-xl bg-stone-950 p-3 text-white dark:bg-[#2a2118]">
              <span className="grid size-8 place-items-center rounded-lg bg-red-600 dark:bg-amber-500"><Zap className="size-4 dark:text-stone-950" /></span>
              <div className="min-w-0"><p className="text-[10px] font-semibold text-stone-400">Próximo foco</p><p className="truncate text-xs font-extrabold">Pegada alta → Uchi-mata</p></div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 -left-5 hidden items-center gap-3 rounded-xl border border-stone-200 bg-white p-3 shadow-[0_12px_30px_-12px_rgba(40,25,16,.25)] sm:flex dark:border-white/10 dark:bg-[#221e1a]">
        <span className="grid size-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="size-4" /></span>
        <div><p className="text-xs font-black">Treino registrado</p><p className="text-[11px] text-stone-500 dark:text-stone-400">4 semanas seguidas</p></div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f7f6f2] text-stone-950 dark:bg-[#100e0c] dark:text-stone-50">
      <LandingNav />

      <section className="px-4 pb-20 pt-28 sm:px-8 sm:pb-28 sm:pt-36">
        <div className="mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_.95fr]">
          <div className="max-w-2xl">
            <h1 className="text-balance text-[clamp(2.75rem,6.4vw,5.6rem)] font-black leading-[.95] tracking-[-.04em]">
              Seu treino não termina no <span className="relative whitespace-nowrap text-red-700 dark:text-amber-400">rei.<svg className="absolute -bottom-1.5 left-1/2 h-2 w-[90%] -translate-x-1/2 text-red-300 dark:text-amber-700" viewBox="0 0 260 12" fill="none" aria-hidden="true"><path d="M3 8.5C72 2 164 2 257 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-7 max-w-[34rem] text-pretty text-lg leading-8 text-stone-600 dark:text-stone-300">
              Registre o que aprendeu, entenda seus erros e entre no próximo treino com um plano claro para evoluir.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-4 text-base font-extrabold text-white transition-colors hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">
                Criar minha conta grátis <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a href="#como-funciona" className="inline-flex items-center justify-center rounded-xl border border-stone-300 px-6 py-4 text-base font-bold text-stone-800 transition-colors hover:border-stone-400 hover:bg-white dark:border-white/15 dark:text-stone-100 dark:hover:bg-white/5">
                Ver como funciona
              </a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-stone-500 dark:text-stone-400">
              {["Sem cartão", "Plano gratuito", "Dados protegidos"].map((item) => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-red-700 dark:text-amber-400" />{item}</li>)}
            </ul>
          </div>
          <ProductPreview />
        </div>
      </section>

      <section id="recursos" className="scroll-mt-16 border-t border-stone-200/80 px-4 py-20 sm:px-8 sm:py-28 dark:border-white/[.07]">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-balance text-[clamp(2.2rem,4.5vw,3.6rem)] font-black leading-[1] tracking-[-.04em]">Memória de atleta. Organização de campeão.</h2>
            <p className="mt-5 max-w-md text-[17px] leading-7 text-stone-600 dark:text-stone-400">Menos informação perdida depois do treino. Mais intenção no que você faz amanhã.</p>
          </div>
          <ul className="divide-y divide-stone-200 border-y border-stone-200 dark:divide-white/[.07] dark:border-white/[.07]">
            {features.map(({ icon: Icon, title, description, pro }) => (
              <li key={title} className="flex gap-5 py-6">
                <Icon className="mt-1 size-5 shrink-0 text-red-700 dark:text-amber-400" />
                <div className="min-w-0">
                  <h3 className="flex items-center gap-2.5 text-lg font-black tracking-[-.02em]">
                    {title}
                    {pro && <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">Pró</span>}
                  </h3>
                  <p className="mt-1.5 text-[15px] leading-6 text-stone-600 dark:text-stone-400">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto mt-20 grid max-w-6xl overflow-hidden rounded-2xl bg-stone-950 text-white lg:grid-cols-[1fr_1.1fr] dark:bg-[#211a14]">
          <div className="p-7 sm:p-10">
            <Trophy className="size-6 text-red-400 dark:text-amber-400" />
            <h3 className="mt-5 max-w-md text-3xl font-black tracking-[-.035em]">Sua preparação começa antes da inscrição.</h3>
            <p className="mt-4 max-w-lg leading-7 text-stone-300">Acompanhe os eventos da FPJUDO, ative alertas e conecte cada bloco de treino à competição que importa.</p>
          </div>
          <ul className="space-y-2 border-t border-white/10 p-5 sm:p-7 lg:border-l lg:border-t-0">
            {competitions.map((event, i) => (
              <li key={event.title} className={`flex items-center gap-4 rounded-xl p-3.5 ${i === 0 ? "bg-white/10" : ""}`}>
                <span className="w-16 shrink-0 text-center text-[11px] font-black leading-4 text-stone-300 tabular-nums">{event.date}</span>
                <div><p className="text-sm font-extrabold">{event.title}</p><p className="mt-0.5 text-xs text-stone-400">{event.place}</p></div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-16 bg-[#efece6] px-4 py-20 sm:px-8 sm:py-28 dark:bg-[#171310]">
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-2xl text-balance text-[clamp(2.2rem,4.5vw,3.6rem)] font-black leading-[1] tracking-[-.04em]">Três passos entre treinar e evoluir.</h2>
          <ol className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map(({ title, copy }, index) => (
              <li key={title} className="border-t-2 border-stone-950 pt-5 dark:border-stone-50">
                <h3 className="flex items-baseline gap-3 text-2xl font-black tracking-[-.03em]"><span className="text-base text-red-700 tabular-nums dark:text-amber-400">{index + 1}.</span>{title}</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-6 text-stone-600 dark:text-stone-400">{copy}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="planos" className="scroll-mt-16 px-4 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <h2 className="text-balance text-[clamp(2.2rem,4.5vw,3.6rem)] font-black leading-[1] tracking-[-.04em]">Escolha o ritmo da sua evolução.</h2>
            <p className="mt-5 text-[17px] leading-7 text-stone-600 dark:text-stone-400">Comece grátis e avance quando fizer sentido para o seu judô.</p>
          </div>
          <div className="mt-12 grid items-stretch gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-2xl border p-7 ${plan.featured ? "border-red-700 bg-red-700 text-white dark:border-amber-500/60 dark:bg-[#2a2118]" : "border-stone-200 bg-white dark:border-white/10 dark:bg-white/[.03]"}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black">{plan.name}</h3>
                  {plan.featured && <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold dark:bg-amber-500 dark:text-stone-950">Mais escolhido</span>}
                </div>
                <p className="mt-5 flex items-baseline gap-2"><span className="text-4xl font-black tracking-[-.04em] tabular-nums">{plan.price}</span>{plan.suffix && <span className={`text-sm font-semibold ${plan.featured ? "text-red-100 dark:text-amber-200" : "text-stone-500 dark:text-stone-400"}`}>{plan.suffix}</span>}</p>
                <p className={`mt-3 text-sm leading-6 ${plan.featured ? "text-red-50 dark:text-stone-300" : "text-stone-600 dark:text-stone-400"}`}>{plan.description}</p>
                <ul className={`mt-6 flex-1 space-y-3 border-t pt-6 ${plan.featured ? "border-white/20" : "border-stone-200 dark:border-white/10"}`}>
                  {plan.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm font-semibold"><Check className={`mt-0.5 size-4 shrink-0 ${plan.featured ? "text-white dark:text-amber-400" : "text-red-700 dark:text-amber-400"}`} />{feature}</li>)}
                </ul>
                <a href={plan.href} className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-extrabold transition-colors ${plan.featured ? "bg-white text-red-800 hover:bg-red-50 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400" : "border border-stone-300 text-stone-900 hover:border-stone-400 hover:bg-stone-50 dark:border-white/15 dark:text-white dark:hover:bg-white/5"}`}>{plan.cta}</a>
              </article>
            ))}
          </div>
          <p className="mt-6 flex items-center gap-2 text-sm font-semibold text-stone-500 dark:text-stone-400"><ShieldCheck className="size-4" /> Pagamento seguro pelo Mercado Pago. Cancele o mensal quando quiser.</p>
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-8 sm:pb-28">
        <div className="mx-auto max-w-6xl rounded-2xl bg-stone-950 px-6 py-14 text-white sm:px-12 sm:py-20 dark:bg-[#251c15]">
          <h2 className="max-w-3xl text-balance text-4xl font-black leading-[1.02] tracking-[-.04em] sm:text-6xl">Dê um propósito a cada ida ao tatame.</h2>
          <p className="mt-5 max-w-xl text-lg leading-8 text-stone-300">Crie sua conta gratuita e faça hoje o primeiro registro da sua evolução.</p>
          <a href="/cadastro" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 font-extrabold text-white transition-colors hover:bg-red-500 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">Começar gratuitamente <ArrowRight className="size-4" /></a>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-4 py-8 sm:px-8 dark:border-white/[.07]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Brand />
          <p className="text-center text-xs text-stone-500 dark:text-stone-400">© {new Date().getFullYear()} Judo Calendar. Evolução também se anota.</p>
        </div>
      </footer>
    </main>
  );
}
