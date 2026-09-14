"use client";

import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ small = false }: { small?: boolean }) {
  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("jc-theme", next ? "dark" : "light");
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`group grid place-items-center rounded-xl border border-stone-200 bg-white/70 text-stone-600 transition hover:border-red-200 hover:text-red-700 dark:border-white/10 dark:bg-white/5 dark:text-stone-300 dark:hover:border-amber-500/30 dark:hover:text-amber-300 ${small ? "size-9" : "size-10"}`}
      aria-label="Alternar tema claro ou escuro"
      title="Alternar tema"
    >
      <Moon className="size-[18px] dark:hidden" />
      <Sun className="hidden size-[18px] dark:block" />
    </button>
  );
}
