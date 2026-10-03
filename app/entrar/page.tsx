import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = { title: "Entrar" };

type LoginPageProps = {
  searchParams: Promise<{ erro?: string | string[] }>;
};

// Só exibe mensagens emitidas pelo próprio app, nunca texto arbitrário da URL.
const knownErrors = new Set([
  "Não foi possível concluir a autenticação.",
  "Sua conta foi autenticada, mas o perfil ainda não foi preparado. A atualização do banco precisa ser aplicada.",
]);

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;
  const initialMessage = typeof erro === "string" && knownErrors.has(erro) ? erro : "";

  return <AuthPage mode="login" initialMessage={initialMessage} />;
}
