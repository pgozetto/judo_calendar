import type { Metadata } from "next";
import { PasswordRecovery } from "@/components/password-recovery";

export const metadata: Metadata = { title: "Recuperar senha" };

export default function RecoverPasswordPage() {
  return <PasswordRecovery mode="request" />;
}
