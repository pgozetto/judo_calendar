"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Mail, UserRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { safeNextPath } from "@/lib/safe-path";
import { createClient } from "@/lib/supabase/client";

function authErrorMessage(message: string) {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered") || normalized.includes("already exists")) return "Este e-mail já está cadastrado.";
  if (normalized.includes("password")) return "Use uma senha com pelo menos 8 caracteres.";
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) return "O limite de e-mails foi atingido. Aguarde alguns minutos ou tente com outro e-mail.";
  return "Não foi possível concluir. Confira os dados e tente novamente.";
}

async function prepareWorkspace(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase.rpc("ensure_user_workspace");
  return !error && data;
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

    try {
      const form = new FormData(event.currentTarget);
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const password = String(form.get("password") ?? "");
      const supabase = createClient();

      if (isSignup) {
        const username = String(form.get("username") ?? "")
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_");

        const search = new URLSearchParams(window.location.search);
        const selectedPlan = search.get("plano");
        const next = selectedPlan ? `/assinar?plano=${encodeURIComponent(selectedPlan)}` : "/app";
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password, termsAccepted: form.get("terms") === "on" }),
        });
        const registerResult = await registerResponse.json().catch(() => ({})) as { code?: string; error?: string };

        if (registerResponse.ok) {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error || !data.session) {
            setMessage("Conta criada. Tente entrar novamente para acessar seu dojo.");
            return;
          }
          if (!(await prepareWorkspace(supabase))) {
            setMessage("Conta criada, mas ainda estamos preparando seu dojo. Tente entrar novamente em alguns segundos.");
            return;
          }
          window.location.assign(next);
          return;
        }

        if (registerResult.code !== "server_not_configured") {
          setMessage(registerResult.error ?? "Não foi possível criar sua conta agora.");
          return;
        }

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
          if (!(await prepareWorkspace(supabase))) {
            setMessage("Conta criada, mas ainda estamos preparando seu dojo. Tente entrar novamente em alguns segundos.");
            return;
          }
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
          if (!(await prepareWorkspace(supabase))) {
            setMessage("Sua sessão foi criada, mas ainda estamos preparando seu dojo. Tente novamente em alguns segundos.");
            return;
          }
          const search = new URLSearchParams(window.location.search);
          const destination = safeNextPath(search.get("next"));
          // A navegação completa garante que o servidor receba os cookies da
          // sessão recém-criada antes de renderizar a área privada.
          window.location.assign(destination);
          return;
        }
      }
    } catch {
      setMessage("Não foi possível concluir agora. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-[#f7f6f2] text-stone-950 dark:bg-[#100e0c] dark:text-stone-50 lg:grid-cols-[.9fr_1.1fr]">
      <section className="hidden bg-stone-950 p-10 text-white lg:flex lg:flex-col lg:justify-between dark:bg-[#1c1611]">
        <Brand href="/" onDark />
        <div className="max-w-xl">
          <h1 className="text-[3.6rem] font-black leading-[.98] tracking-[-.04em]">O treino passa.<br /><span className="text-red-400 dark:text-amber-400">O aprendizado fica.</span></h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-stone-300">Construa um histórico do seu judô e chegue ao próximo treino sabendo exatamente onde focar.</p>
          <ul className="mt-9 space-y-3">
            {["Registro de treino em menos de 3 minutos", "Plano de jogo sempre à mão", "Funciona no celular e no computador"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[15px] font-semibold text-stone-200"><Check className="size-4 text-red-400 dark:text-amber-400" />{item}</li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-stone-500">Judo Calendar · Treine. Registre. Evolua.</p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <div className="lg:hidden"><Brand /></div>
          <Link href="/" className="hidden items-center gap-2 text-sm font-bold text-stone-500 transition-colors hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50 lg:inline-flex"><ArrowLeft className="size-4" /> Voltar ao início</Link>
          <ThemeToggle />
        </div>
        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
          <div>
            <h2 className="text-4xl font-black tracking-[-.04em]">{isSignup ? "Crie sua conta grátis" : "Entre no seu dojo"}</h2>
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
              <span className="mb-2 flex items-center justify-between text-sm font-extrabold">Senha {!isSignup && <a href="/recuperar-senha" className="text-xs text-red-700 hover:underline dark:text-amber-400">Esqueci minha senha</a>}</span>
              <span className="relative block"><LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-[18px] -translate-y-1/2 text-stone-400" /><input name="password" required minLength={8} type={showPassword ? "text" : "password"} autoComplete={isSignup ? "new-password" : "current-password"} placeholder="Mínimo de 8 caracteres" className="h-13 w-full rounded-xl border border-stone-300 bg-white pl-11 pr-12 text-sm outline-none transition placeholder:text-stone-400 focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-white/5 dark:hover:text-stone-200" aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOff className="size-[18px]" /> : <Eye className="size-[18px]" />}</button></span>
            </label>
            {isSignup && <label className="flex items-start gap-3 text-xs leading-5 text-stone-500 dark:text-stone-400"><input name="terms" required type="checkbox" className="mt-0.5 size-4 rounded accent-red-700 dark:accent-amber-500" />Concordo com os Termos de Uso e a Política de Privacidade do Judo Calendar.</label>}
            {message && <p role="status" aria-live="polite" className={`rounded-xl border px-4 py-3 text-sm font-bold ${success ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300" : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"}`}>{message}</p>}
            <button disabled={loading} className="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-extrabold text-white transition hover:bg-red-800 disabled:cursor-wait disabled:opacity-70 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">{loading ? "Preparando seu dojo..." : isSignup ? "Criar conta grátis" : "Entrar"}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></button>
          </form>

          <p className="mt-7 text-center text-sm text-stone-500 dark:text-stone-400">{isSignup ? "Já tem uma conta?" : "Ainda não tem uma conta?"} <a href={isSignup ? "/entrar" : "/cadastro"} className="font-extrabold text-red-700 hover:underline dark:text-amber-400">{isSignup ? "Entrar" : "Criar gratuitamente"}</a></p>
          <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-stone-500 dark:text-stone-400"><LockKeyhole className="size-3.5" /> Sua senha é armazenada criptografada.</p>
        </div>
      </section>
    </main>
  );
}
