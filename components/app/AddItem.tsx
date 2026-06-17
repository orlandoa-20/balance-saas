"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { PILLARS, ITEM_TYPES, type PillarId, type ItemType } from "@/lib/constants/pillars";
import { weekDays, toKey, WEEKDAYS, fmtDuration } from "@/lib/date";
import { addItem } from "@/lib/data/actions";

const TYPE_ORDER: ItemType[] = ["task", "study", "class", "exam", "work", "event"];
const DEFAULT_PILLAR: Record<ItemType, PillarId> = {
  class: "academics", study: "academics", exam: "academics", task: "academics", work: "work", event: "relationships",
};
const DURATIONS = [30, 45, 60, 90, 120, 180];

export function AddItem({
  as = "button",
  defaultDate,
  defaultType,
  defaultPillar,
  defaultTitle,
  label = "Ajouter",
}: {
  as?: "button" | "fab" | "cta" | "day";
  defaultDate?: string;
  defaultType?: ItemType;
  defaultPillar?: PillarId;
  defaultTitle?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const trigger =
    as === "day" ? (
      <button onClick={() => setOpen(true)} className="flex w-full items-center justify-center gap-1 rounded-lg py-1.5 text-[12px] font-medium text-ink-faint transition hover:bg-surface-2 hover:text-evergreen-ink">
        <Icon name="plus" className="size-[14px]" /> Ajouter
      </button>
    ) : as === "fab" ? (
      <button onClick={() => setOpen(true)} aria-label="Ajouter un bloc" className="fixed bottom-[86px] right-[18px] z-30 grid size-14 place-items-center rounded-[19px] text-[var(--on-primary)] shadow-[var(--sh-lg)] transition active:scale-90 lg:hidden" style={{ background: "var(--evergreen)" }}>
        <Icon name="plus" className="size-[26px]" />
      </button>
    ) : as === "cta" ? (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">{label}</button>
    ) : (
      <button onClick={() => setOpen(true)} className="btn btn-primary btn-sm">
        <Icon name="plus" className="size-[18px]" /> {label}
      </button>
    );

  return (
    <>
      {trigger}
      {open && (
        <Dialog
          defaultDate={defaultDate}
          defaultType={defaultType}
          defaultPillar={defaultPillar}
          defaultTitle={defaultTitle}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function Dialog({
  defaultDate,
  defaultType,
  defaultPillar,
  defaultTitle,
  onClose,
}: {
  defaultDate?: string;
  defaultType?: ItemType;
  defaultPillar?: PillarId;
  defaultTitle?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const days = weekDays();
  const [type, setType] = useState<ItemType>(defaultType ?? "task");
  const [pillar, setPillar] = useState<PillarId>(defaultPillar ?? (defaultType ? DEFAULT_PILLAR[defaultType] : "academics"));
  const [date, setDate] = useState(defaultDate ?? toKey(new Date()));
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(60);
  const [title, setTitle] = useState(defaultTitle ?? "");
  const [repeat, setRepeat] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function pickType(t: ItemType) {
    setType(t);
    setPillar(DEFAULT_PILLAR[t]);
  }

  function save() {
    if (!title.trim()) return setErr("Donne un titre à ton bloc.");
    setErr(null);
    startTransition(async () => {
      const res = await addItem({
        title: title.trim(),
        pillar,
        type,
        date,
        start_time: time || null,
        duration_min: duration,
        repeatWeeks: repeat ? 14 : 1,
      });
      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        setErr(res.error ?? "Erreur");
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(20,16,12,0.5)] p-5 backdrop-blur-sm" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Ajouter un bloc" className="max-h-[90dvh] w-full max-w-[460px] overflow-y-auto rounded-[30px] bg-surface p-6 shadow-[var(--sh-lg)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[21px]">Ajouter un bloc</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid size-9 place-items-center rounded-full bg-surface-2 text-ink-soft">
            <Icon name="x" className="size-[18px]" />
          </button>
        </div>

        {/* type */}
        <div className="mb-4 flex flex-wrap gap-1.5 rounded-full bg-bg-alt p-1.5">
          {TYPE_ORDER.map((t) => (
            <button key={t} onClick={() => pickType(t)} aria-pressed={t === type} className={`min-w-16 flex-1 rounded-full py-2 text-[12.5px] font-semibold transition ${t === type ? "bg-surface text-ink shadow-[var(--sh-sm)]" : "text-ink-soft"}`}>
              {ITEM_TYPES[t].label}
            </button>
          ))}
        </div>

        {/* pillar */}
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Domaine de vie</label>
        <div className="mb-4 grid grid-cols-4 gap-2">
          {PILLARS.map((p) => (
            <button key={p.id} onClick={() => setPillar(p.id)} aria-pressed={p.id === pillar} className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 p-3 transition ${p.id === pillar ? "border-evergreen bg-[color-mix(in_srgb,var(--evergreen)_8%,var(--surface))]" : "border-transparent bg-surface-2"}`}>
              <span className="grid size-8 place-items-center rounded-[10px] text-white" style={{ background: p.colorVar }}>
                <Icon name={p.icon} className="size-[18px]" />
              </span>
              <span className="text-center text-[10.5px] font-bold leading-tight">{p.label}</span>
            </button>
          ))}
        </div>

        {/* title */}
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Titre</label>
        <div className="relative mb-4 flex items-center">
          <Icon name="edit" className="absolute left-3.5 size-[18px] text-ink-faint" />
          <input className="field-input pl-11" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex : Réviser le chapitre 4" autoFocus />
        </div>

        {/* day */}
        <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Jour</label>
        <div className="mb-2 flex flex-wrap gap-2">
          {days.map((d, i) => {
            const k = toKey(d);
            return (
              <button key={k} onClick={() => setDate(k)} aria-pressed={k === date} className={`rounded-full px-3.5 py-2 text-[13.5px] font-semibold shadow-[0_0_0_1px_var(--line)] transition ${k === date ? "bg-evergreen text-[var(--on-primary)]" : "bg-surface-2"}`}>
                {WEEKDAYS[i]} {d.getDate()}
              </button>
            );
          })}
        </div>

        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Choisir une autre date (semaines à venir)"
          className="field-input mb-4"
        />

        {/* time + duration */}
        <div className="grid grid-cols-2 gap-3.5">
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Heure (optionnel)</label>
            <div className="relative flex items-center">
              <Icon name="clock" className="absolute left-3.5 size-[18px] text-ink-faint" />
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="field-input pl-11" />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Durée</label>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((m) => (
                <button key={m} onClick={() => setDuration(m)} aria-pressed={m === duration} className={`rounded-full px-3.5 py-2 text-[13px] font-semibold shadow-[0_0_0_1px_var(--line)] transition ${m === duration ? "bg-evergreen text-[var(--on-primary)]" : "bg-surface-2"}`}>
                  {fmtDuration(m)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* recurrence */}
        <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl bg-surface-2 px-4 py-3">
          <input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} className="size-[18px] accent-[var(--evergreen)]" />
          <span className="flex items-center gap-2 text-[13.5px] font-semibold">
            <Icon name="refresh" className="size-[18px] text-ink-soft" /> Répéter chaque semaine
            <span className="text-ink-faint">(semestre · 14 sem.)</span>
          </span>
        </label>

        {err && <p role="alert" className="mt-3 text-[13px] font-medium text-destructive">{err}</p>}

        <button onClick={save} disabled={pending} className="btn btn-primary btn-block btn-lg mt-5">
          {pending ? "…" : "Ajouter à mon planning"}
        </button>
      </div>
    </div>
  );
}
