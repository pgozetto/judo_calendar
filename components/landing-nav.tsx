"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Brand } from "./brand";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "#recursos", label: "Recursos" },
  { href: "#como-funciona", label: "Como funciona" },
  { href: "#planos", label: "Planos" },
];

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 border-b border-stone-900/[.06] bg-[#f7f6f2]/90 backdrop-blur-md dark:border-white/[.07] dark:bg-[#100e0c]/90">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-8">
        <Brand />
        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-sm font-semibold text-stone-600 transition-colors hover:text-stone-950 dark:text-stone-400 dark:hover:text-stone-50">{link.label}</a>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <a href="/entrar" className="px-3 py-2 text-sm font-bold text-stone-700 transition-colors hover:text-red-700 dark:text-stone-200 dark:hover:text-amber-300">Entrar</a>
          <a href="/cadastro" className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-800 dark:bg-amber-500 dark:text-stone-950 dark:hover:bg-amber-400">Começar grátis</a>
        </div>
        <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="grid size-11 place-items-center rounded-lg border border-stone-200 md:hidden dark:border-white/10" aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen}>
          {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {menuOpen && (
        <div className="border-t border-stone-200 bg-[#f7f6f2] px-4 pb-5 pt-3 md:hidden dark:border-white/10 dark:bg-[#100e0c]">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={() => setMenuOpen(false)} className="block rounded-lg px-3 py-3 text-base font-semibold text-stone-700 hover:bg-stone-100 dark:text-stone-200 dark:hover:bg-white/5">{link.label}</a>
          ))}
          <div className="mt-3 flex items-center gap-2 border-t border-stone-200 pt-4 dark:border-white/10">
            <ThemeToggle />
            <a href="/entrar" className="flex-1 rounded-lg border border-stone-300 px-4 py-3 text-center text-sm font-bold dark:border-white/15">Entrar</a>
            <a href="/cadastro" className="flex-1 rounded-lg bg-red-700 px-4 py-3 text-center text-sm font-bold text-white dark:bg-amber-500 dark:text-stone-950">Criar conta</a>
          </div>
        </div>
      )}
    </nav>
  );
}
