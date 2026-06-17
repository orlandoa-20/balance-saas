import { Icon } from "@/components/Icon";
import { AppHeader } from "@/components/app/ui";
import { AddItem } from "@/components/app/AddItem";
import { StudyPlanGenerator } from "@/components/app/StudyPlanGenerator";
import { getProfile, getWeekItems, getTargets, getStreak } from "@/lib/data/queries";
import { coachInsights } from "@/lib/coach";
import { balanceScore, productivityScore } from "@/lib/balance";

export const metadata = { title: "Coach" };

export default async function CoachPage() {
  const [profile, week, targets, streak] = await Promise.all([
    getProfile(), getWeekItems(), getTargets(), getStreak(),
  ]);
  const name = (profile?.full_name ?? "toi").split(" ")[0];
  const cards = coachInsights({ weekItems: week, targets, name, streak });
  const bScore = balanceScore(week, targets);
  const pScore = productivityScore(week, targets);
  const isPro = profile?.plan === "pro";

  return (
    <>
      <AppHeader eyebrow="Coach" title="Ton coach BalanceU" sub="Des conseils basés sur ta semaine réelle — jamais génériques." action={false} />

      {/* hero */}
      <div className="mb-5 rounded-[30px] p-6 text-[var(--on-primary)] shadow-[var(--sh-md)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
        <h2 className="text-[22px] text-[color:var(--on-primary)]">Salut {name} 👋</h2>
        <p className="mt-1.5 text-[14.5px] opacity-90">
          J’ai analysé ta semaine. Équilibre {bScore}/100, productivité {pScore}/100. Voici ce sur quoi je me concentrerais.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Chip icon="scale">Équilibre {bScore}</Chip>
          <Chip icon="bolt">Productivité {pScore}</Chip>
          <Chip icon="flame">Série {streak} j</Chip>
        </div>
      </div>

      {/* cards */}
      {cards.map((c, i) => (
        <div key={i} className={`mb-3 flex gap-3.5 rounded-[22px] bg-surface p-4.5 shadow-[0_0_0_1px_var(--line)] ${c.tone === "warn" ? "border-l-4 border-l-clay" : "border-l-4 border-l-gold"}`}>
          <span className="grid size-[42px] shrink-0 place-items-center rounded-[13px] text-white" style={{ background: c.tone === "warn" ? "linear-gradient(155deg,var(--clay),#9c5f49)" : "linear-gradient(155deg,var(--gold),var(--clay))" }}>
            <Icon name={c.icon} className="size-[22px]" />
          </span>
          <div className="min-w-0">
            <h3 className="font-[family-name:var(--font-sans)] text-[15px] font-bold">{c.title}</h3>
            <p className="text-[13.5px] text-ink-soft">{c.text}</p>
            {c.action && (
              <div className="mt-2.5">
                <AddItem as="cta" label={c.action.label} defaultPillar={c.action.pillar} defaultType={c.action.type} defaultTitle={c.action.title} />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Pro AI */}
      <div className="mt-2">
        {isPro ? (
          <StudyPlanGenerator />
        ) : (
          <div className="flex gap-3.5 rounded-[22px] p-5 shadow-[0_0_0_1px_var(--line)]" style={{ background: "linear-gradient(155deg,color-mix(in srgb,var(--gold) 16%,var(--surface)),var(--surface))" }}>
            <span className="grid size-[42px] shrink-0 place-items-center rounded-[13px] text-white" style={{ background: "linear-gradient(155deg,var(--gold),var(--clay))" }}>
              <Icon name="sparkles" className="size-[22px]" />
            </span>
            <div>
              <h3 className="font-[family-name:var(--font-sans)] text-[15px] font-bold">Débloque le coach IA complet</h3>
              <p className="text-[13.5px] text-ink-soft">Plans d’étude générés, prévision de charge et de burnout, projection de moyenne. Réservé au plan Pro.</p>
              <a href="/settings" className="btn btn-gold btn-sm mt-2.5">
                <Icon name="sparkles" className="size-[18px]" /> Passer à Pro
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Chip({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12.5px] font-semibold text-white">
      <Icon name={icon} className="size-[16px]" /> {children}
    </span>
  );
}
