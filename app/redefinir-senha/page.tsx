import type { Metadata } from "next";
import { PasswordRecovery } from "@/components/password-recovery";

export const metadata: Metadata = { title: "Redefinir senha" };

export default function UpdatePasswordPage() {
  return <PasswordRecovery mode="update" />;
}
