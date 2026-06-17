"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { getPillar, ITEM_TYPES } from "@/lib/constants/pillars";
import { toggleItem } from "@/lib/data/actions";
import type { Item } from "@/lib/types";

export function MiniItem({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const p = getPillar(item.pillar);
  const completable = ITEM_TYPES[item.type]?.completable;

  function onClick() {
    if (!completable) return;
    start(async () => {
      await toggleItem(item.id, !item.done);
      router.refresh();
    });
  }

  return (
    <button
      onClick={onClick}
      title={completable ? `${item.title} — cocher` : item.title}
      className={`mb-1.5 w-full rounded-lg px-2 py-1.5 text-left text-[11.5px] font-semibold leading-tight text-white transition ${
        item.done ? "line-through opacity-60" : "hover:brightness-110"
      } ${pending ? "opacity-50" : ""} ${completable ? "cursor-pointer" : "cursor-default"}`}
      style={{ background: p.colorVar }}
    >
      {item.start_time && <span className="opacity-85">{item.start_time} </span>}
      {item.title}
    </button>
  );
}
