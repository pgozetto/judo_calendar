import Link from "next/link";

export function Brand({ compact = false, href = "/" }: { compact?: boolean; href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3" aria-label="Judo Calendar">
      <span className="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-red-500 to-red-800 shadow-[0_8px_24px_rgba(185,28,28,.24)] ring-1 ring-black/10 transition-transform group-hover:-rotate-3 dark:from-red-600 dark:to-red-950">
        <svg viewBox="0 0 40 40" className="size-9" aria-hidden="true">
          <rect x="5.5" y="8" width="29" height="27" rx="5.5" fill="#fffdf8" stroke="#181411" strokeWidth="1.8" />
          <path d="M6.5 15.5h27" stroke="#181411" strokeWidth="1.8" />
          <path d="M13 5.5v5M27 5.5v5" stroke="#fffdf8" strokeWidth="2.7" strokeLinecap="round" />
          <path d="m15.5 20-4 3.2 2.8 8.2h11.4l2.8-8.2-4-3.2-4.5 3.3-4.5-3.3Z" fill="white" stroke="#181411" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="m15.5 20 4.5 7.2 4.5-7.2M16.6 29.7h6.8" fill="none" stroke="#ce2029" strokeWidth="1.5" />
        </svg>
      </span>
      {!compact && (
        <span className="text-[17px] font-extrabold tracking-[-0.035em] text-stone-950 dark:text-stone-50">
          Judo <span className="text-red-700 dark:text-amber-400">Calendar</span>
        </span>
      )}
    </Link>
  );
}
