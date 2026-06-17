import { Icon } from "@/components/Icon";
import { AddItem } from "@/components/app/AddItem";

export function AppHeader({ eyebrow, title, sub, action = true }: { eyebrow: string; title: string; sub?: string; action?: boolean }) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1 className="mt-1.5 text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-[14.5px] text-ink-soft">{sub}</p>}
      </div>
      {action && (
        <div className="hidden sm:block">
          <AddItem as="button" label="Ajouter" />
        </div>
      )}
    </div>
  );
}

export function EmptyState({ icon, title, text, ctaDate }: { icon: string; title: string; text: string; ctaDate?: string }) {
  return (
    <div className="card flex flex-col items-center px-5 py-8 text-center">
      <div className="mb-3.5 grid size-[60px] place-items-center rounded-[18px] bg-bg-alt text-evergreen">
        <Icon name={icon} className="size-[30px]" />
      </div>
      <h3 className="font-[family-name:var(--font-sans)] text-[15.5px] font-bold">{title}</h3>
      <p className="mx-auto mt-1 mb-3.5 max-w-[30ch] text-[14px] text-ink-soft">{text}</p>
      <AddItem as="cta" label="Planifier un bloc" defaultDate={ctaDate} />
    </div>
  );
}

export function Block({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[19px]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
