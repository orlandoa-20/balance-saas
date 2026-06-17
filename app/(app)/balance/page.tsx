import { getWeekItems, getTargets } from "@/lib/data/queries";
import { balanceScore, verdict, hoursByPillar } from "@/lib/balance";
import { Ring, Donut, Legend } from "@/components/charts";
import { PILLARS } from "@/lib/constants/pillars";
import { fmtHours } from "@/lib/date";
import { TargetStepper } from "@/components/app/TargetStepper";
import { AppHeader } from "@/components/app/ui";

export const metadata = { title: "Équilibre" };

function message(score: number): string {
  if (score >= 85) return "Semaine remarquablement saine. Protège cet équilibre.";
  if (score >= 70) return "Tu tiens un bel équilibre — ajuste juste un ou deux domaines.";
  if (score >= 50) return "Bonne base. Quelques domaines réclament un peu d’attention.";
  return "Ton temps penche fortement d’un côté. Ton coach a des idées pour rééquilibrer.";
}

export default async function BalancePage() {
  const [week, targets] = await Promise.all([getWeekItems(), getTargets()]);
  const bScore = balanceScore(week, targets);
  const actual = hoursByPillar(week);
  const segments = PILLARS.map((p) => ({ value: actual[p.id], colorVar: p.colorVar })).filter((s) => s.value > 0);
  const totalH = PILLARS.reduce((s, p) => s + actual[p.id], 0);

  return (
    <>
      <AppHeader eyebrow="Équilibre" title="Ton équilibre de vie" sub="Basé sur tes priorités — viser la cible, ni trop ni trop peu." action={false} />

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card flex flex-col items-center gap-2 p-6 text-center">
          <Ring value={bScore} size={150} stroke={14} color="var(--evergreen)" caption="sur 100" />
          <div className="mt-3.5 text-base font-bold">{verdict(bScore)}</div>
          <p className="max-w-[32ch] text-[14px] text-ink-soft">{message(bScore)}</p>
        </div>

        <div className="card flex flex-col items-center justify-center gap-1.5 p-6">
          <Donut
            segments={segments.length ? segments : [{ value: 1, colorVar: "var(--bg-alt)" }]}
            size={150}
            stroke={22}
            center={
              <div>
                <div className="font-[family-name:var(--font-display)] text-[26px] font-semibold">{fmtHours(totalH)}</div>
                <div className="text-xs text-ink-soft">planifiées</div>
              </div>
            }
          />
          <Legend ids={PILLARS.map((p) => p.id)} />
        </div>
      </div>

      <section className="mb-6 mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[19px]">Par domaine</h2>
          <span className="text-[12.5px] text-ink-faint">| barre = cible</span>
        </div>
        {PILLARS.map((p) => {
          const a = actual[p.id];
          const t = targets[p.id];
          const w = t > 0 ? Math.min(100, (a / t) * 100) : 0;
          return (
            <div key={p.id} className="mb-2.5 rounded-2xl bg-surface p-4 shadow-[0_0_0_1px_var(--line)]">
              <div className="mb-2.5 flex items-center gap-2.5">
                <span className="size-3.5 rounded-full" style={{ background: p.colorVar }} />
                <span className="flex-1 text-[14.5px] font-semibold">{p.label}</span>
                <span className="text-[12.5px] font-semibold tabular-nums text-ink-soft">{fmtHours(a)} / {t} h</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-bg-alt">
                <span className="block h-full rounded-full transition-[width] duration-700" style={{ width: `${w}%`, background: p.colorVar }} />
                <span className="absolute -bottom-0.5 -top-0.5 w-[2.5px] rounded bg-ink/35" style={{ left: "100%" }} />
              </div>
            </div>
          );
        })}
      </section>

      <section className="mb-6">
        <h2 className="mb-3 text-[19px]">Tes cibles hebdomadaires</h2>
        <div className="card px-4 py-1">
          {PILLARS.map((p, i) => (
            <div key={p.id} className={`flex items-center gap-3.5 py-3 ${i < PILLARS.length - 1 ? "border-b border-[var(--line-soft)]" : ""}`}>
              <span className="size-3 rounded-full" style={{ background: p.colorVar }} />
              <span className="flex-1 text-[14px] font-semibold">{p.label}</span>
              <TargetStepper pillar={p.id} value={targets[p.id]} />
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
