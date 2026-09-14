import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = { title: "Entrar" };

type LoginPageProps = {
  searchParams: Promise<{ erro?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { erro } = await searchParams;
  const initialMessage = typeof erro === "string" ? erro : "";

  return <AuthPage mode="login" initialMessage={initialMessage} />;
}
