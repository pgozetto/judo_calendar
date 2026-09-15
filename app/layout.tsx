import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://judo-calendar-pedro.pgozetto.chatgpt.site"),
  title: {
    default: "Judo Calendar — evolua treino após treino",
    template: "%s | Judo Calendar",
  },
  description:
    "Seu diário inteligente de judô para registrar treinos, organizar o plano de jogo e transformar cada erro em evolução.",
  applicationName: "Judo Calendar",
  keywords: ["judô", "diário de treino", "plano de jogo", "calendário", "atleta"],
  openGraph: {
    title: "Judo Calendar",
    description: "Treine. Registre. Evolua.",
    type: "website",
    locale: "pt_BR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f6f2",
};

const themeScript = `
  try {
    document.documentElement.classList.remove('dark');
  } catch (_) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
