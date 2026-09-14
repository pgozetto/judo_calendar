"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, Github, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/client";

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered") || normalized.includes("already exists")) return "Este e-mail já está cadastrado.";
  if (normalized.includes("password")) return "Use uma senha com pelo menos 8 caracteres.";
  if (normalized.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return "Não foi possível concluir. Confira os dados e tente novamente.";
}

function safeNextPath(value: string | null) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/app";
}

export function AuthPage({ mode, initialMessage = "" }: { mode: "login" | "signup"; initialMessage?: string }) {
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");
    const supabase = createClient();

    if (isSignup) {
      const username = String(form.get("username") ?? "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_");

      const { data: available, error: usernameError } = await supabase.rpc("is_username_available", {
        candidate: username,
      });

      if (usernameError || !available) {
        setMessage(usernameError ? "Não foi possível validar o usuário agora." : "Este nome de usuário já está em uso.");
        setLoading(false);
        return;
      }

      const search = new URLSearchParams(window.location.search);
      const selectedPlan = search.get("plano");
      const next = selectedPlan ? `/assinar?plano=${encodeURIComponent(selectedPlan)}` : "/app";
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, display_name: username },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });

      if (error) {
        setMessage(authErrorMessage(error.message));
      } else if (!data.session) {
        setSuccess(true);
        setMessage("Conta criada. Confirme o link enviado ao seu e-mail para entrar.");
      } else {
        window.location.assign(next);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage(authErrorMessage(error.message));
      } else if (!data.session) {
        setMessage("A sessão não foi criada. Tente entrar novamente.");
      } else {
        const search = new URLSearchParams(window.location.search);
        const destination = safeNextPath(search.get("next"));
        // Contas antigas podem ter sido criadas antes do provisionamento do
        // perfil. A chamada é idempotente e, em ambientes ainda sem a nova
        // migração, não impede o acesso de contas que já possuem perfil.
        await supabase.rpc("ensure_user_workspace");

        // A navegação completa garante que o servidor receba os cookies da
        // sessão recém-criada antes de renderizar a área privada.
        window.location.assign(destination);
        return;
      }
    }

    setLoading(false);
  }

  async function signInWithSocial(provider: "google" | "github") {
    setLoading(true);
    setMessage("");
    const search = new URLSearchParams(window.location.search);
    const safeNext = safeNextPath(search.get("next"));
    const { error } = await createClient().auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}` },
    });
    if (error) {
      setMessage(authErrorMessage(error.message));
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7f6f2] text-stone-950 dark:bg-[#100e0c] dark:text-stone-50 lg:grid-cols-[.9fr_1.1fr]">
      <section className="relative hidden overflow-hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between dark:bg-[#251c15]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(220,38,38,.35),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(145,25,30,.27),transparent_38%)] dark:bg-[radial-gradient(circle_at_15%_10%,rgba(217,163,55,.22),transparent_34%),radial-gradient(circle_at_85%_85%,rgba(103,67,35,.32),transparent_38%)]" />
        <div className="relative"><Brand href="/" /></div>
        <div className="relative max-w-xl">
          <p className="text-xs font-black uppercase tracking-[.18em] text-red-400 dark:text-amber-400">Seu dojo digital</p>
          <h1 className="mt-5 text-6xl font-black leading-[.96] tracking-[-.06em]">O treino passa.<br />O aprendizado fica.</h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-stone-400">Construa um histórico do seu judô e chegue ao próximo treino sabendo exatamente onde focar.</p>
          <div className="mt-9 grid grid-cols-2 gap-3">
            {["Registros rápidos", "Plano de jogo", "Visão da evolução", "Acesso em qualquer tela"].map((item) => (
              <span key={item} className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-3 text-sm font-bold text-stone-200"><Check className="size-4 text-red-400 dark:text-amber-400" />{item}</span>
            ))}
          </div>
        </div>
        <p className="relative text-xs text-stone-500">Judo Calendar · Treine. Registre. Evolua.</p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="lg:hidden"><Brand /></div>
          <Link href="/" className="hidden items-center gap-2 text-sm font-bold text-stone-500 transition hover:text-red-700 dark:text-stone-400 dark:hover:text-amber-300 lg:inline-flex"><ArrowLeft className="size-4" /> Voltar ao início</Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-red-700 dark:text-amber-400">{isSignup ? "Comece gratuitamente" : "Bem-vindo de volta"}</p>
            <h2 className="mt-3 text-4xl font-black tracking-[-.045em]">{isSignup ? "Crie sua conta" : "Entre no seu dojo"}</h2>
            <p className="mt-3 text-[15px] leading-6 text-stone-500 dark:text-stone-400">{isSignup ? "Seu primeiro registro está a poucos segundos." : "Continue de onde parou e prepare o próximo treino."}</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-9 space-y-5">
            {isSignup && (
              <label className="block">
                <span className="mb-2 block text-sm font-extrabold">Nome de usuário</span>
                <span className="relative block"><UserRound className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" /><input name="username" required minLength={3} autoComplete="username" placeholder="Como devemos chamar você?" className="h-13 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /></span>
              </label>
            )}
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold">E-mail</span>
              <span className="relative block"><Mail className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" /><input name="email" required type="email" autoComplete="email" placeholder="voce@exemplo.com" className="h-13 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /></span>
            </label>
            <label className="block">
              <span className="mb-2 flex items-center justify-between text-sm font-extrabold">Senha {!isSignup && <Link href="/recuperar-senha" className="text-xs text-red-700 hover:underline dark:text-amber-400">Esqueci minha senha</Link>}</span>
              <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" /><input name="password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Mínimo de 8 caracteres" className="h-13 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button></span>
            </label>
            {isSignup && <label className="flex items-start gap-3 text-xs leading-5 text-stone-500 dark:text-stone-400"><input required type="checkbox" className="mt-0.5 size-4 rounded accent-red-700 dark:accent-amber-500" />Concordo com os Termos de Uso e a Política de Privacidade do Judo Calendar.</label>}
            {message && <p role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"}`}>{message}</p>}
            <button disabled={loading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-extrabold text-white shadow-[0_12px_30px_rgba(185,28,28,.18)] transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">{loading ? "Preparando seu dojo..." : isSignup ? "Criar conta grátis" : "Entrar"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
          </form>

          <div className="my-7 flex items-center gap-3 text-[10px] font-black uppercase tracking-wider text-stone-400"><span className="h-px flex-1 bg-stone-200 dark:bg-white/10" /> ou continue com <span className="h-px flex-1 bg-stone-200 dark:bg-white/10" /></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" disabled={loading} onClick={() => signInWithSocial("google")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white text-sm font-extrabold transition hover:border-red-300 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-500/30"><span className="text-base font-black text-blue-600">G</span> Google</button>
            <button type="button" disabled={loading} onClick={() => signInWithSocial("github")} className="flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white text-sm font-extrabold transition hover:border-red-300 disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:hover:border-amber-500/30"><Github className="size-4" /> GitHub</button>
          </div>

          <p className="mt-7 text-center text-sm text-stone-500 dark:text-stone-400">{isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <Link href={isSignup ? "/entrar" : "/cadastro"} className="font-extrabold text-red-700 hover:underline dark:text-amber-400">{isSignup ? "Entrar" : "Criar gratuitamente"}</Link></p>
          <p className="mt-6 rounded-xl border border-stone-200 bg-white/60 p-3 text-center text-[11px] leading-5 text-stone-400 dark:border-white/8 dark:bg-white/[.025]">Autenticação protegida pelo Supabase. Sua senha nunca é salva nas tabelas públicas do app.</p>
        </div>
      </section>
    </main>
  );
}
