import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SideNav, BottomNav } from "@/components/app/AppNav";
import { AddItem } from "@/components/app/AddItem";
import type { Profile } from "@/lib/types";

const PLAN_LABEL: Record<string, string> = { free: "Free", plus: "Plus", pro: "Pro" };

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="grid size-[38px] place-items-center rounded-xl text-[var(--on-primary)] shadow-[var(--sh-sm)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
        <Icon name="logo" className="size-[21px]" />
      </span>
      <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">BalanceU</span>
    </Link>
  );
}

export function AppShell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      {/* mobile top bar */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-[18px] py-3 backdrop-blur-md lg:hidden">
        <Brand />
        <ThemeToggle />
      </header>

      {/* desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1.5 border-r border-line bg-bg-alt p-4 lg:flex">
        <div className="px-2.5 py-4">
          <Brand />
        </div>
        <SideNav />
        <div className="mt-auto flex flex-col gap-2">
          <div className="rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]">
            <div className="text-xs text-ink-faint">Ton plan</div>
            <div className="flex items-center gap-1.5 font-[family-name:var(--font-display)] text-base font-semibold">
              <Icon name={profile.plan === "pro" ? "sparkles" : "leaf"} className="size-[18px]" />
              {PLAN_LABEL[profile.plan] ?? "Free"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <form action="/auth/signout" method="post" className="flex-1">
              <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-surface px-3 py-2.5 text-[13.5px] font-semibold text-ink-soft shadow-[0_0_0_1px_var(--line)] transition hover:text-ink" type="submit">
                <Icon name="logout" className="size-[18px]" /> Déconnexion
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* content */}
      <main className="mx-auto w-full max-w-[1080px] px-[18px] pb-[110px] pt-6 lg:px-[30px] lg:pb-10">{children}</main>

      <BottomNav />
      <AddItem as="fab" />
    </div>
  );
}
