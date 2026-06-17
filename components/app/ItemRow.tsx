"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { getPillar, ITEM_TYPES } from "@/lib/constants/pillars";
import { fmtDuration } from "@/lib/date";
import { toggleItem, deleteItem } from "@/lib/data/actions";
import type { Item } from "@/lib/types";

export function ItemRow({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const pillar = getPillar(item.pillar);
  const completable = ITEM_TYPES[item.type]?.completable;

  function toggle() {
    startTransition(async () => {
      await toggleItem(item.id, !item.done);
      router.refresh();
    });
  }
  function remove() {
    startTransition(async () => {
      await deleteItem(item.id);
      router.refresh();
    });
  }

  return (
    <div className={`group mb-2 flex items-center gap-3.5 rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)] ${pending ? "opacity-60" : ""}`}>
      {completable ? (
        <button onClick={toggle} aria-label={item.done ? "Marquer non fait" : "Terminer"} className={`grid size-6 shrink-0 place-items-center rounded-lg border-2 transition ${item.done ? "border-evergreen bg-evergreen text-[var(--on-primary)]" : "border-line text-transparent hover:border-evergreen"}`}>
          <Icon name="check" className="size-[14px]" />
        </button>
      ) : (
        <span className="h-9 w-1 shrink-0 self-stretch rounded-full" style={{ background: pillar.colorVar }} />
      )}

      <div className="min-w-0 flex-1">
        <div className={`text-[14.5px] font-semibold ${item.done ? "text-ink-faint line-through" : ""}`}>{item.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12.5px] text-ink-soft">
          {item.start_time && <span>{item.start_time}</span>}
          <span className="size-2 rounded-full" style={{ background: pillar.colorVar }} />
          {pillar.label}
          <span>· {fmtDuration(item.duration_min)}</span>
        </div>
      </div>

      <button onClick={remove} aria-label="Supprimer" className="rounded-lg p-2 text-ink-faint opacity-0 transition hover:bg-[color-mix(in_srgb,var(--destructive)_10%,transparent)] hover:text-destructive group-hover:opacity-100">
        <Icon name="trash" className="size-[18px]" />
      </button>
    </div>
  );
}
