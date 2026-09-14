import type { Metadata } from "next";
import { AuthPage } from "@/components/auth-page";

export const metadata: Metadata = { title: "Criar conta" };

export default function SignUpPage() {
  return <AuthPage mode="signup" />;
}
