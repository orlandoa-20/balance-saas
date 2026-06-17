"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { PILLARS, type PillarId } from "@/lib/constants/pillars";
import { completeOnboarding } from "@/lib/data/actions";

const GOALS = [
  { id: "grades", ic: "grad", color: "var(--p-academics)", lab: "Améliorer mes notes" },
  { id: "balance", ic: "scale", color: "var(--p-health)", lab: "Moins de stress, plus d’équilibre" },
  { id: "habits", ic: "flame", color: "var(--p-finances)", lab: "Tenir des habitudes" },
  { id: "time", ic: "clock", color: "var(--p-relationships)", lab: "Mieux gérer mon temps" },
];

export function OnboardingFlow({ defaultName = "" }: { defaultName?: string }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName);
  const [school, setSchool] = useState("");
  const [priorities, setPriorities] = useState<PillarId[]>([]);
  const [goal, setGoal] = useState("");
  const [pending, startTransition] = useTransition();
  const TOTAL = 4;

  function next() {
    if (step === 0 && !name.trim()) setName("Toi");
    setStep((s) => Math.min(TOTAL - 1, s + 1));
  }
  function finish() {
    startTransition(async () => {
      await completeOnboarding({ full_name: name.trim() || "Toi", school, priorities, goal });
    });
  }

  return (
    <div className="flex min-h-dvh flex-col items-center px-5 pb-8 pt-7">
      <div className="flex w-full max-w-[480px] gap-1.5">
        {Array.from({ length: TOTAL }).map((_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-evergreen" : "bg-bg-alt"}`} />
        ))}
      </div>

      <div className="flex w-full max-w-[480px] flex-1 flex-col justify-center py-8">
        <div className="eyebrow">Étape {step + 1} / {TOTAL}</div>

        {step === 0 && (
          <Step title="On fait connaissance" sub="Pour personnaliser ton espace.">
            <FieldText label="Prénom" icon="user" value={name} onChange={setName} placeholder="Alex" />
            <FieldText label="École / université (optionnel)" icon="grad" value={school} onChange={setSchool} placeholder="Sorbonne Université" />
            <Actions onNext={next} />
          </Step>
        )}

        {step === 1 && (
          <Step title="Tes priorités de vie" sub="Choisis ce qui compte le plus en ce moment.">
            <div className="grid grid-cols-2 gap-3">
              {PILLARS.map((p) => {
                const on = priorities.includes(p.id);
                return (
                  <Choice key={p.id} on={on} color={p.colorVar} icon={p.icon} label={p.label}
                    onClick={() => setPriorities((cur) => (on ? cur.filter((x) => x !== p.id) : [...cur, p.id]))} />
                );
              })}
            </div>
            <Actions onBack={() => setStep(0)} onNext={next} />
          </Step>
        )}

        {step === 2 && (
          <Step title="Ton objectif n°1" sub="Qu’est-ce qui ferait de ce semestre une réussite ?">
            <div className="grid grid-cols-2 gap-3">
              {GOALS.map((g) => (
                <Choice key={g.id} on={goal === g.id} color={g.color} icon={g.ic} label={g.lab} onClick={() => setGoal(g.id)} />
              ))}
            </div>
            <Actions onBack={() => setStep(1)} onNext={next} />
          </Step>
        )}

        {step === 3 && (
          <Step title={`Tout est prêt, ${name.trim() || "toi"} !`} sub="Ton espace est configuré selon tes priorités. Tu pourras tout ajuster.">
            <div className="card flex items-center gap-3.5 p-5">
              <span className="grid size-[46px] place-items-center rounded-[14px] text-white" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
                <Icon name="sparkles" className="size-6" />
              </span>
              <div>
                <div className="font-bold">Ton tableau de bord personnalisé</div>
                <div className="text-[13.5px] text-ink-soft">Score d’équilibre, planning et coach — prêts.</div>
              </div>
            </div>
            <button onClick={finish} disabled={pending} className="btn btn-primary btn-block btn-lg mt-5">
              {pending ? "…" : "Découvrir mon espace"}
            </button>
          </Step>
        )}
      </div>
    </div>
  );
}

function Step({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="animate-[fadeIn_.35s_ease]">
      <h1 className="mb-1.5 mt-2.5 text-3xl">{title}</h1>
      <p className="mb-6 text-ink-soft">{sub}</p>
      {children}
    </div>
  );
}

function Actions({ onBack, onNext }: { onBack?: () => void; onNext: () => void }) {
  return (
    <div className="mt-7 flex gap-3">
      {onBack && <button onClick={onBack} className="btn btn-ghost"><Icon name="arrow-left" className="size-[18px]" /> Retour</button>}
      <button onClick={onNext} className="btn btn-primary btn-block">Continuer</button>
    </div>
  );
}

function FieldText({ label, icon, value, onChange, placeholder }: { label: string; icon: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</label>
      <div className="relative flex items-center">
        <Icon name={icon} className="absolute left-3.5 size-[18px] text-ink-faint" />
        <input className="field-input pl-11" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
    </div>
  );
}

function Choice({ on, color, icon, label, onClick }: { on: boolean; color: string; icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} aria-pressed={on} className={`flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition ${on ? "border-evergreen bg-[color-mix(in_srgb,var(--evergreen)_8%,var(--surface))]" : "border-transparent bg-surface shadow-[0_0_0_1px_var(--line)]"}`}>
      <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] text-white" style={{ background: color }}>
        <Icon name={icon} className="size-[18px]" />
      </span>
      <span className="text-[14.5px] font-semibold">{label}</span>
      <span className={`ml-auto text-evergreen transition ${on ? "opacity-100" : "opacity-0"}`}><Icon name="check-circle" className="size-[18px]" /></span>
    </button>
  );
}
