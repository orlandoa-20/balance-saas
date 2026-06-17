"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { setTarget } from "@/lib/data/actions";
import type { PillarId } from "@/lib/constants/pillars";

export function TargetStepper({ pillar, value }: { pillar: PillarId; value: number }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useState(value);
  const [pending, start] = useTransition();

  function change(dir: number) {
    const next = Math.max(0, Math.min(60, optimistic + dir));
    if (next === optimistic) return;
    setOptimistic(next);
    start(async () => {
      await setTarget(pillar, next);
      router.refresh();
    });
  }

  return (
    <div className={`flex items-center gap-1 ${pending ? "opacity-70" : ""}`}>
      <button onClick={() => change(-1)} aria-label="Diminuer" className="grid size-8 place-items-center rounded-full bg-surface-2 text-evergreen-ink shadow-[0_0_0_1px_var(--line)] active:scale-90">
        <Icon name="minus" className="size-[16px]" />
      </button>
      <span className="w-14 text-center text-[13.5px] font-bold tabular-nums">{optimistic} h</span>
      <button onClick={() => change(1)} aria-label="Augmenter" className="grid size-8 place-items-center rounded-full bg-surface-2 text-evergreen-ink shadow-[0_0_0_1px_var(--line)] active:scale-90">
        <Icon name="plus" className="size-[16px]" />
      </button>
    </div>
  );
}
