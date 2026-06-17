import Link from "next/link";
import { requireAdmin } from "@/lib/admin/data";
import { Icon } from "@/components/Icon";

export const metadata = { title: "Administration" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin(); // redirects non-admins

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-[color-mix(in_srgb,var(--bg)_88%,transparent)] px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl text-[var(--on-primary)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
            <Icon name="settings" className="size-[18px]" />
          </span>
          <span className="font-[family-name:var(--font-display)] text-lg font-semibold">Administration</span>
        </div>
        <Link href="/dashboard" className="btn btn-ghost btn-sm">
          <Icon name="arrow-left" className="size-[16px]" /> App
        </Link>
      </header>
      <main className="mx-auto max-w-[1080px] px-5 py-6">{children}</main>
    </div>
  );
}
