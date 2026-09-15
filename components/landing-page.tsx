"use client";

import {
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarDays,
  Check,
  ChevronRight,
  CirclePlay,
  Crown,
  Dumbbell,
  ImagePlus,
  Menu,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Swords,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

const features = [
  {
    icon: CalendarDays,
    title: "Diário no calendário",
    description: "Clique no dia, registre o treino e enxergue sua evolução com clareza.",
  },
  {
    icon: Swords,
    title: "Plano de jogo",
    description: "Organize pegada, entrada, sequência e ne-waza antes de pisar no tatame.",
  },
  {
    icon: NotebookPen,
    title: "Notas livres",
    description: "Guarde ajustes, ideias, metas e detalhes técnicos em um espaço sem limites.",
  },
  {
    icon: BookOpenCheck,
    title: "Biblioteca de golpes",
    description: "Use modelos prontos por técnica e complete com as anotações do seu jogo.",
    pro: true,
  },
  {
    icon: ImagePlus,
    title: "Vídeos e imagens",
    description: "Anexe referências às notas para rever exatamente o que precisa melhorar.",
    pro: true,
  },
  {
    icon: BellRing,
    title: "Revisão que chega até você",
    description: "Receba o resumo semanal e lembretes do plano de jogo antes do treino.",
    pro: true,
  },
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
    price: "R$ 20",
    suffix: "/mês",
    description: "O sistema completo para competir melhor.",
    features: ["Tudo do Gratuito", "Biblioteca de golpes", "Vídeos e imagens", "Revisão semanal por e-mail", "Calendário FPJUDO"],
    cta: "Assinar o Pró",
    href: "/cadastro?plano=pro_monthly",
    featured: true,
  },
  {
    name: "Vitalício",
    price: "R$ 150",
    suffix: "uma vez",
    description: "Acesso completo, sem mensalidade.",
    features: ["Todos os recursos Pró", "Pagamento único", "Atualizações futuras", "Selo de membro fundador"],
    cta: "Garantir o vitalício",
    href: "/cadastro?plano=founder_lifetime",
  },
];

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f6f2] text-stone-950 selection:bg-red-200 dark:bg-[#100e0c] dark:text-stone-50 dark:selection:bg-amber-800">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-900/5 bg-[#f7f6f2]/85 backdrop-blur-xl dark:border-white/8 dark:bg-[#100e0c]/82">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <div className="hidden items-center gap-8 md:flex">
            <a href="#recursos" className="text-sm font-semibold text-stone-600 transition hover:text-red-700 dark:text-stone-300 dark:hover:text-amber-300">Recursos</a>
            <a href="#como-funciona" className="text-sm font-semibold text-stone-600 transition hover:text-red-700 dark:text-stone-300 dark:hover:text-amber-300">Como funciona</a>
            <a href="#planos" className="text-sm font-semibold text-stone-600 transition hover:text-red-700 dark:text-stone-300 dark:hover:text-amber-300">Planos</a>
          </div>
          <div className="hidden items-center gap-3 md:flex">
            <ThemeToggle />
            <a href="/entrar" className="px-3 py-2 text-sm font-bold text-stone-700 transition hover:text-red-700 dark:text-stone-200 dark:hover:text-amber-300">Entrar</a>
            <a href="/cadastro" className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white shadow-[0_10px_25px_rgba(185,28,28,.2)] transition hover:-translate-y-0.5 hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">Começar grátis</a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-10 place-items-center rounded-xl border border-stone-200 md:hidden dark:border-white/10" aria-label="Abrir menu">
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="border-t border-stone-200 bg-[#f7f6f2] px-5 py-5 md:hidden dark:border-white/10 dark:bg-[#100e0c]">
            <div className="flex flex-col gap-2">
              {["recursos", "como-funciona", "planos"].map((item) => (
                <a key={item} href={`#${item}`} onClick={() => setMenuOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-semibold capitalize text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5">{item.replace("-", " ")}</a>
              ))}
              <div className="mt-3 flex items-center gap-2 border-t border-stone-200 pt-4 dark:border-white/10">
                <ThemeToggle />
                <a href="/entrar" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl border border-stone-300 px-4 py-3 text-center text-sm font-bold dark:border-white/15">Entrar</a>
                <a href="/cadastro" onClick={() => setMenuOpen(false)} className="flex-1 rounded-xl bg-red-700 px-4 py-3 text-center text-sm font-bold text-white dark:bg-amber-500 dark:text-stone-950">Criar conta</a>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="relative px-5 pb-20 pt-32 sm:px-8 sm:pb-28 sm:pt-40">
        <div className="pointer-events-none absolute left-1/2 top-0 h-[620px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(220,38,38,.10),transparent_66%)] dark:bg-[radial-gradient(circle,rgba(217,163,55,.11),transparent_64%)]" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1.02fr_.98fr]">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold uppercase tracking-[.12em] text-red-800 dark:border-amber-500/25 dark:bg-amber-500/8 dark:text-amber-300">
              <Sparkles className="size-3.5" /> Feito por judocas, para judocas
            </div>
            <h1 className="text-balance text-[clamp(3rem,7vw,6.6rem)] font-black leading-[.91] tracking-[-.065em]">
              Seu treino não termina no <span className="relative text-red-700 dark:text-amber-400">rei.<svg className="absolute -bottom-2 left-1/2 h-2.5 w-[90%] -translate-x-1/2 text-red-300 dark:text-amber-700" viewBox="0 0 260 12" fill="none" aria-hidden="true"><path d="M3 8.5C72 2 164 2 257 7" stroke="currentColor" strokeWidth="5" strokeLinecap="round" /></svg></span>
            </h1>
            <p className="mt-8 max-w-xl text-pretty text-lg leading-8 text-stone-600 sm:text-xl dark:text-stone-300">
              Registre o que aprendeu, entenda seus erros e entre no próximo treino com um plano claro para evoluir.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href="/cadastro" className="group inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-4 text-base font-extrabold text-white shadow-[0_15px_40px_rgba(185,28,28,.22)] transition hover:-translate-y-0.5 hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">
                Criar minha conta <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a href="/app" className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white/60 px-6 py-4 text-base font-extrabold text-stone-800 transition hover:border-red-300 hover:bg-white dark:border-white/12 dark:bg-white/5 dark:text-stone-100 dark:hover:border-amber-500/30 dark:hover:bg-white/8">
                <CirclePlay className="size-5" /> Explorar demonstração
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-2"><Check className="size-4 text-red-700 dark:text-amber-400" /> Sem cartão</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-red-700 dark:text-amber-400" /> Plano gratuito</span>
              <span className="flex items-center gap-2"><Check className="size-4 text-red-700 dark:text-amber-400" /> Seus dados protegidos</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[610px] lg:mx-0">
            <div className="absolute -inset-8 -z-10 rotate-2 rounded-[3rem] bg-red-200/35 blur-3xl dark:bg-amber-900/15" />
            <div className="overflow-hidden rounded-[28px] border border-stone-200/80 bg-white shadow-[0_30px_90px_rgba(40,25,16,.14)] dark:border-white/10 dark:bg-[#1a1714] dark:shadow-black/45">
              <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4 dark:border-white/8">
                <div className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-red-500" /><span className="size-2.5 rounded-full bg-amber-400" /><span className="size-2.5 rounded-full bg-emerald-500" /></div>
                <span className="text-xs font-bold text-stone-400">MEU DOJO</span>
                <span className="size-6 rounded-full bg-gradient-to-br from-red-200 to-red-500 dark:from-amber-200 dark:to-amber-600" />
              </div>
              <div className="grid grid-cols-[62px_1fr] sm:grid-cols-[158px_1fr]">
                <div className="border-r border-stone-100 p-3 sm:p-4 dark:border-white/8">
                  <Brand compact />
                  <div className="mt-7 space-y-2">
                    {[CalendarDays, Swords, NotebookPen, Trophy].map((Icon, index) => (
                      <div key={index} className={`flex items-center gap-2.5 rounded-lg p-2.5 ${index === 0 ? "bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300" : "text-stone-400"}`}><Icon className="size-4 shrink-0" /><span className="hidden text-[11px] font-bold sm:block">{["Visão geral", "Plano de jogo", "Notas", "Competições"][index]}</span></div>
                    ))}
                  </div>
                </div>
                <div className="min-w-0 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="text-xs font-bold text-stone-400">DOMINGO, 13 SET</p><h3 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Seja bem vindo, Oss!</h3></div>
                    <a href="/entrar" className="rounded-lg bg-red-700 px-3 py-2 text-[10px] font-bold text-white transition hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">+ REGISTRAR</a>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[{v:"12",l:"treinos"},{v:"8",l:"técnicas"},{v:"4",l:"semanas"}].map((s) => <div key={s.l} className="rounded-xl bg-stone-50 p-3 dark:bg-white/5"><p className="text-lg font-black">{s.v}</p><p className="text-[9px] font-bold uppercase text-stone-400">{s.l}</p></div>)}
                  </div>
                  <div className="mt-4 rounded-2xl border border-stone-100 p-4 dark:border-white/8">
                    <div className="mb-3 flex items-center justify-between"><p className="text-xs font-extrabold">Setembro 2026</p><ChevronRight className="size-4 text-stone-400" /></div>
                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold text-stone-400">{["D","S","T","Q","Q","S","S"].map((d,i)=><span key={i}>{d}</span>)}</div>
                    <div className="mt-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold">{Array.from({length:21},(_,i)=>i+1).map((d)=><span key={d} className={`grid aspect-square place-items-center rounded-md ${d===13?"bg-red-700 font-black text-white dark:bg-amber-500 dark:text-stone-950": [2,5,8,10].includes(d)?"bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300":""}`}>{d}</span>)}</div>
                  </div>
                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-[#1b1714] p-4 text-white dark:bg-[#2a2118]">
                    <span className="grid size-9 place-items-center rounded-xl bg-red-600 dark:bg-amber-500"><Zap className="size-4 dark:text-stone-950" /></span>
                    <div className="min-w-0"><p className="text-[10px] font-bold text-stone-400">PRÓXIMO FOCO</p><p className="truncate text-xs font-extrabold">Pegada alta → Uchi-mata</p></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-7 -left-4 hidden items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3.5 shadow-xl sm:flex dark:border-white/10 dark:bg-[#221e1a]">
              <span className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"><Check className="size-5" /></span>
              <div><p className="text-xs font-black">Treino registrado</p><p className="text-[11px] text-stone-500 dark:text-stone-400">Sua sequência continua: 4 semanas</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200/70 bg-white/60 px-5 py-8 dark:border-white/8 dark:bg-white/[.025]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
          <p className="text-sm font-bold text-stone-500 dark:text-stone-400">Do primeiro treino à próxima competição.</p>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm font-black tracking-[-.02em] text-stone-400 dark:text-stone-500"><span>REGISTRE</span><span>ANALISE</span><span>PLANEJE</span><span>EVOLUA</span></div>
        </div>
      </section>

      <section id="recursos" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="section-kicker">Tudo no lugar certo</p>
            <h2 className="section-title">Memória de atleta.<br />Organização de campeão.</h2>
            <p className="section-copy">Menos informação perdida depois do treino. Mais intenção no que você faz amanhã.</p>
          </div>
          <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, pro }, index) => (
              <article key={title} className={`group relative overflow-hidden rounded-[24px] border p-6 transition duration-300 hover:-translate-y-1 ${index === 0 ? "border-red-200 bg-red-50/70 dark:border-amber-500/20 dark:bg-amber-500/[.06]" : "border-stone-200 bg-white dark:border-white/8 dark:bg-white/[.035]"}`}>
                <div className="flex items-start justify-between">
                  <span className={`grid size-11 place-items-center rounded-xl ${index === 0 ? "bg-red-700 text-white dark:bg-amber-500 dark:text-stone-950" : "bg-stone-100 text-stone-700 dark:bg-white/8 dark:text-stone-200"}`}><Icon className="size-5" /></span>
                  {pro && <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300">Pró</span>}
                </div>
                <h3 className="mt-8 text-xl font-black tracking-[-.025em]">{title}</h3>
                <p className="mt-3 text-[15px] leading-6 text-stone-600 dark:text-stone-400">{description}</p>
              </article>
            ))}
          </div>
          <div className="mt-4 grid overflow-hidden rounded-[24px] border border-stone-200 bg-stone-950 text-white dark:border-amber-500/15 dark:bg-[#211a14] lg:grid-cols-[1fr_1.15fr]">
            <div className="p-7 sm:p-10">
              <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.14em] text-red-400 dark:text-amber-400"><Trophy className="size-4" /> Calendário competitivo</span>
              <h3 className="mt-5 max-w-md text-3xl font-black tracking-[-.04em]">Sua preparação começa antes da inscrição.</h3>
              <p className="mt-4 max-w-lg leading-7 text-stone-400">Acompanhe eventos da FPJUDO, marque seus objetivos e conecte cada bloco de treino à competição mais importante.</p>
            </div>
            <div className="relative min-h-60 overflow-hidden border-t border-white/8 p-6 lg:border-l lg:border-t-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(220,38,38,.22),transparent_55%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(217,163,55,.20),transparent_55%)]" />
              <div className="relative space-y-3">
                {[{date:"19–20 SET",title:"Inter-regional Aspirante",place:"Etapas por delegacia"},{date:"24–27 SET",title:"Troféu Brasil Júnior",place:"Individual e equipes"},{date:"26 SET",title:"Paulista Aspirante",place:"Marília · SP"}].map((event,i)=><div key={event.title} className={`flex items-center gap-4 rounded-2xl border p-4 ${i===0?"border-red-500/40 bg-red-500/10 dark:border-amber-500/35 dark:bg-amber-500/10":"border-white/10 bg-white/5"}`}><span className="grid h-12 w-16 shrink-0 place-items-center rounded-xl bg-white/10 px-1 text-center text-[9px] font-black leading-4">{event.date}</span><div><p className="text-sm font-extrabold">{event.title}</p><p className="mt-1 text-xs text-stone-400">{event.place}</p></div>{i===0&&<span className="ml-auto size-2 rounded-full bg-red-400 dark:bg-amber-400" />}</div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="scroll-mt-20 bg-[#edeae4] px-5 py-24 sm:px-8 sm:py-32 dark:bg-[#171310]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="section-kicker">Simples como deve ser</p>
            <h2 className="section-title mx-auto max-w-3xl">Três passos entre treinar e evoluir.</h2>
          </div>
          <div className="relative mt-16 grid gap-5 lg:grid-cols-3">
            <div className="absolute left-[17%] right-[17%] top-9 hidden border-t border-dashed border-stone-400/40 lg:block" />
            {[
              {n:"01", icon:Dumbbell,title:"Treine",copy:"Viva o treino por inteiro. Depois, abra o Judo Calendar enquanto a memória está fresca."},
              {n:"02",icon:NotebookPen,title:"Registre",copy:"Anote acertos, erros, técnicas e sensações. Leva menos de três minutos."},
              {n:"03",icon:Zap,title:"Aplique",copy:"Revise seu plano antes de voltar ao tatame e transforme observação em ação."}
            ].map(({n,icon:Icon,title,copy})=><div key={n} className="relative z-10 text-center"><span className="mx-auto grid size-[72px] place-items-center rounded-2xl border border-stone-300 bg-[#f7f6f2] shadow-sm dark:border-white/10 dark:bg-[#211c18]"><Icon className="size-6 text-red-700 dark:text-amber-400" /></span><p className="mt-7 text-xs font-black tracking-[.16em] text-red-700 dark:text-amber-400">PASSO {n}</p><h3 className="mt-2 text-2xl font-black">{title}</h3><p className="mx-auto mt-3 max-w-sm text-[15px] leading-6 text-stone-600 dark:text-stone-400">{copy}</p></div>)}
          </div>
        </div>
      </section>

      <section id="planos" className="scroll-mt-20 px-5 py-24 sm:px-8 sm:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="section-kicker">Planos transparentes</p>
            <h2 className="section-title">Escolha o ritmo da sua evolução.</h2>
            <p className="section-copy">Comece grátis e avance quando fizer sentido para o seu judô.</p>
          </div>
          <div className="mt-14 grid items-stretch gap-5 lg:grid-cols-3">
            {plans.map((plan) => (
              <article key={plan.name} className={`relative flex flex-col rounded-[26px] border p-7 sm:p-8 ${plan.featured ? "border-red-700 bg-red-700 text-white shadow-[0_25px_70px_rgba(185,28,28,.22)] dark:border-amber-500 dark:bg-[#2a2118] dark:shadow-amber-950/20" : "border-stone-200 bg-white dark:border-white/10 dark:bg-white/[.035]"}`}>
                {plan.featured && <span className="absolute -top-3 right-6 inline-flex items-center gap-1.5 rounded-full bg-stone-950 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white dark:bg-amber-500 dark:text-stone-950"><Crown className="size-3" /> Mais escolhido</span>}
                <h3 className="text-lg font-black">{plan.name}</h3>
                <div className="mt-5 flex items-end gap-2"><span className="text-4xl font-black tracking-[-.05em]">{plan.price}</span>{plan.suffix && <span className={`pb-1 text-sm font-semibold ${plan.featured ? "text-red-100 dark:text-amber-200" : "text-stone-500"}`}>{plan.suffix}</span>}</div>
                <p className={`mt-4 min-h-12 text-sm leading-6 ${plan.featured ? "text-red-100 dark:text-stone-300" : "text-stone-600 dark:text-stone-400"}`}>{plan.description}</p>
                <div className={`my-7 border-t ${plan.featured ? "border-white/20" : "border-stone-200 dark:border-white/10"}`} />
                <ul className="flex-1 space-y-3.5">{plan.features.map(feature=><li key={feature} className="flex items-start gap-3 text-sm font-semibold"><span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${plan.featured?"bg-white/15":"bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300"}`}><Check className="size-3" /></span>{feature}</li>)}</ul>
                <a href={plan.href} className={`mt-8 inline-flex items-center justify-center rounded-xl px-5 py-3.5 text-sm font-extrabold transition hover:-translate-y-0.5 ${plan.featured ? "bg-white text-red-800 hover:bg-red-50 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400" : "border border-stone-300 bg-stone-50 text-stone-900 hover:border-red-300 dark:border-white/12 dark:bg-white/5 dark:text-white dark:hover:border-amber-500/30"}`}>{plan.cta}</a>
              </article>
            ))}
          </div>
          <p className="mt-7 flex items-center justify-center gap-2 text-center text-xs font-semibold text-stone-500 dark:text-stone-400"><ShieldCheck className="size-4" /> Pagamento seguro. Cancele o plano mensal quando quiser.</p>
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8 sm:pb-32">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[32px] bg-stone-950 px-6 py-16 text-center text-white sm:px-12 sm:py-20 dark:bg-[#251c15]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(220,38,38,.28),transparent_33%),radial-gradient(circle_at_80%_100%,rgba(220,38,38,.18),transparent_35%)] dark:bg-[radial-gradient(circle_at_20%_10%,rgba(217,163,55,.2),transparent_33%),radial-gradient(circle_at_80%_100%,rgba(126,85,43,.25),transparent_35%)]" />
          <div className="relative mx-auto max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.18em] text-red-400 dark:text-amber-400">O próximo treino começa agora</p>
            <h2 className="mt-5 text-balance text-4xl font-black tracking-[-.05em] sm:text-6xl">Dê um propósito a cada ida ao tatame.</h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-stone-400">Crie sua conta gratuita e faça hoje o primeiro registro da sua evolução.</p>
            <a href="/cadastro" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-4 font-extrabold text-white transition hover:-translate-y-0.5 hover:bg-red-500 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">Começar gratuitamente <ArrowRight className="size-4" /></a>
          </div>
        </div>
      </section>

      <footer className="border-t border-stone-200 px-5 py-8 dark:border-white/8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <Brand />
          <p className="text-center text-xs text-stone-500 dark:text-stone-400">© {new Date().getFullYear()} Judo Calendar. Evolução também se anota.</p>
          <div className="flex gap-5 text-xs font-bold text-stone-500 dark:text-stone-400"><a href="#" className="hover:text-red-700 dark:hover:text-amber-400">Termos</a><a href="#" className="hover:text-red-700 dark:hover:text-amber-400">Privacidade</a></div>
        </div>
      </footer>
    </main>
  );
}
