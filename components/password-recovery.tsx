"use client";

import { ArrowLeft, ArrowRight, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { createClient } from "@/lib/supabase/client";

export function PasswordRecovery({ mode }: { mode: "request" | "update" }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setSuccess(false);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    if (mode === "request") {
      const email = String(form.get("email") ?? "").trim().toLowerCase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/redefinir-senha")}`,
      });
      if (error) {
        setMessage("Não foi possível enviar agora. Aguarde um pouco e tente novamente.");
      } else {
        setSuccess(true);
        setMessage("Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.");
      }
    } else {
      const password = String(form.get("password") ?? "");
      const confirmation = String(form.get("confirmation") ?? "");
      if (password.length < 8 || password !== confirmation) {
        setMessage(password.length < 8 ? "Use pelo menos 8 caracteres." : "As duas senhas precisam ser iguais.");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setMessage("O link expirou ou não é válido. Solicite uma nova recuperação.");
      } else {
        setSuccess(true);
        setMessage("Senha atualizada. Redirecionando para o seu dojo...");
        window.setTimeout(() => {
          router.replace("/app");
          router.refresh();
        }, 1000);
      }
    }

    setLoading(false);
  }

  const requesting = mode === "request";

  return (
    <main className="min-h-screen bg-[#f7f6f2] px-5 py-6 text-stone-950 dark:bg-[#100e0c] dark:text-stone-50 sm:px-8">
      <div className="mx-auto flex max-w-5xl items-center justify-between"><Brand /><ThemeToggle /></div>
      <section className="mx-auto mt-16 max-w-md rounded-[26px] border border-stone-200 bg-white p-6 shadow-xl shadow-stone-200/40 sm:p-8 dark:border-white/10 dark:bg-white/[.035] dark:shadow-none">
        <span className="grid size-12 place-items-center rounded-xl bg-red-50 text-red-700 dark:bg-amber-500/10 dark:text-amber-300">{requesting ? <Mail className="size-5" /> : <KeyRound className="size-5" />}</span>
        <p className="mt-6 text-xs font-black uppercase tracking-[.14em] text-red-700 dark:text-amber-400">Segurança da conta</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-.04em]">{requesting ? "Recupere sua senha" : "Crie uma nova senha"}</h1>
        <p className="mt-3 text-sm leading-6 text-stone-500 dark:text-stone-400">{requesting ? "Informe o mesmo e-mail usado no cadastro." : "Escolha uma senha nova com pelo menos 8 caracteres."}</p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {requesting ? (
            <label className="block"><span className="mb-2 block text-sm font-extrabold">E-mail</span><input name="email" type="email" required autoComplete="email" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500 dark:focus:ring-amber-500/10" /></label>
          ) : (
            <><label className="block"><span className="mb-2 block text-sm font-extrabold">Nova senha</span><input name="password" type="password" required minLength={8} autoComplete="new-password" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-red-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500" /></label><label className="block"><span className="mb-2 block text-sm font-extrabold">Confirmar senha</span><input name="confirmation" type="password" required minLength={8} autoComplete="new-password" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-red-500 dark:border-white/10 dark:bg-white/5 dark:focus:border-amber-500" /></label></>
          )}
          {message && <p role="status" aria-live="polite" className={`rounded-xl px-4 py-3 text-sm font-bold ${success ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}>{message}</p>}
          <button disabled={loading || success} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-700 text-sm font-extrabold text-white transition hover:bg-red-800 disabled:opacity-60 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">{loading ? "Aguarde..." : requesting ? "Enviar link seguro" : "Atualizar senha"}<ArrowRight className="size-4" /></button>
        </form>
        <Link href="/entrar" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-stone-500 hover:text-red-700 dark:text-stone-400 dark:hover:text-amber-300"><ArrowLeft className="size-4" /> Voltar para o login</Link>
      </section>
    </main>
  );
}
