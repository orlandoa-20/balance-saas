"use client";

import { useState, useTransition } from "react";
import { Icon } from "@/components/Icon";
import { generateStudyPlan } from "@/lib/coach-ai";

export function StudyPlanGenerator() {
  const [pending, start] = useTransition();
  const [plan, setPlan] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function run() {
    setErr(null);
    start(async () => {
      const res = await generateStudyPlan();
      if (res.ok) setPlan(res.plan ?? "");
      else setErr(res.error ?? "Erreur");
    });
  }

  return (
    <div className="card p-5">
      <div className="mb-3 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(155deg,var(--gold),var(--clay))" }}>
          <Icon name="sparkles" className="size-[22px]" />
        </span>
        <div>
          <h3 className="font-[family-name:var(--font-sans)] text-[16px] font-bold">Plan d’étude IA</h3>
          <p className="text-[13.5px] text-ink-soft">Généré à partir de ta semaine réelle.</p>
        </div>
        <button onClick={run} disabled={pending} className="btn btn-gold btn-sm ml-auto">
          {pending ? "…" : plan ? "Régénérer" : "Générer"}
        </button>
      </div>
      {err && <p role="alert" className="text-[13px] font-medium text-destructive">{err}</p>}
      {plan && (
        <div className="mt-2 whitespace-pre-wrap rounded-2xl bg-surface-2 p-4 text-[14px] leading-relaxed text-ink">
          {plan}
        </div>
      )}
    </div>
  );
}
