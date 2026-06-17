"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icon";

export const TABS = [
  { href: "/dashboard", label: "Aujourd’hui", short: "Accueil", icon: "home" },
  { href: "/planner", label: "Planning", short: "Planning", icon: "calendar" },
  { href: "/balance", label: "Équilibre", short: "Équilibre", icon: "scale" },
  { href: "/coach", label: "Coach", short: "Coach", icon: "compass" },
  { href: "/settings", label: "Profil", short: "Profil", icon: "user" },
] as const;

function active(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function SideNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Navigation">
      {TABS.map((t) => {
        const is = active(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={is ? "page" : undefined}
            className={`flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-[14.5px] font-semibold transition ${
              is ? "bg-surface text-evergreen-ink shadow-[var(--sh-sm)]" : "text-ink-soft hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon name={t.icon} className="size-[21px]" />
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-2 pb-[calc(9px+env(safe-area-inset-bottom))] pt-2.5 backdrop-blur-md lg:hidden" aria-label="Navigation">
      {TABS.map((t) => {
        const is = active(pathname, t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={is ? "page" : undefined}
            className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 ${
              is ? "text-evergreen-ink" : "text-ink-faint"
            }`}
          >
            <Icon name={t.icon} className="size-[23px]" />
            <span className="text-[10.5px] font-bold">{t.short}</span>
          </Link>
        );
      })}
    </nav>
  );
}
