import Link from "next/link";
import { Icon } from "@/components/Icon";
import { Ring, WeeklyBars, Legend, type WeekDay } from "@/components/charts";
import { ItemRow } from "@/components/app/ItemRow";
import { AppHeader, Block, EmptyState } from "@/components/app/ui";
import {
  getProfile, getTargets, getWeekItems, getItemsOn, getCourses, getUpcoming, getStreak,
} from "@/lib/data/queries";
import { balanceScore, productivityScore, verdict, weekCompletion, hoursByPillar, gpa } from "@/lib/balance";
import { PILLARS, getPillar, ITEM_TYPES } from "@/lib/constants/pillars";
import { longDate, todayKey, weekDays, toKey, dayIndex, WEEKDAYS, shortDate, daysUntil } from "@/lib/date";

export const metadata = { title: "Aujourd’hui" };

export default async function DashboardPage() {
  const [profile, targets, week, todayItems, courses, upcoming, streak] = await Promise.all([
    getProfile(), getTargets(), getWeekItems(), getItemsOn(todayKey()), getCourses(), getUpcoming(4), getStreak(),
  ]);

  const firstName = (profile?.full_name ?? "toi").split(" ")[0];
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  const bScore = balanceScore(week, targets);
  const pScore = productivityScore(week, targets);
  const comp = weekCompletion(week);
  const gpaV = gpa(courses);

  const ti = dayIndex();
  const matrix: WeekDay[] = weekDays().map((d, i) => {
    const k = toKey(d);
    const dayItems = week.filter((it) => it.date === k);
    return {
      label: WEEKDAYS[i],
      byPillar: hoursByPillar(dayItems),
      total: dayItems.reduce((s, it) => s + it.duration_min / 60, 0),
      today: i === ti,
    };
  });

  const sortedToday = [...todayItems].sort((a, b) => (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));

  return (
    <>
      <AppHeader eyebrow={longDate()} title={`${greet}, ${firstName}.`} sub="Voici ta journée et l’état de ton équilibre." />

      {/* scores */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ScoreCard ring={<Ring value={bScore} size={76} stroke={9} color="var(--evergreen)" />} label="Score d’équilibre" value={String(bScore)} sub={verdict(bScore)} />
        <ScoreCard ring={<Ring value={pScore} size={76} stroke={9} color="var(--clay)" />} label="Productivité" value={String(pScore)} sub={`${comp.done}/${comp.total} tâches faites`} />
        <div className="card flex items-center gap-4 p-4.5">
          <span className="grid size-[54px] shrink-0 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(155deg,var(--gold),var(--clay))" }}>
            <Icon name="flame" fill className="size-7" />
          </span>
          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft">Série en cours</div>
            <div className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">{streak} j</div>
            <div className="text-[12.5px] text-ink-faint">{streak > 0 ? "continue comme ça !" : "commence aujourd’hui"}</div>
          </div>
        </div>
      </div>

      {/* today + upcoming */}
      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Aujourd’hui" right={<Link href="/planner" className="text-[13.5px] font-semibold text-evergreen-ink">Voir le planning</Link>}>
          {sortedToday.length ? (
            sortedToday.map((it) => <ItemRow key={it.id} item={it} />)
          ) : (
            <EmptyState icon="coffee" title="Journée libre ?" text="Tu as du temps pour toi. Et si tu calais une session ou un moment qui te fait du bien ?" ctaDate={todayKey()} />
          )}
        </Block>

        <Block title="Échéances à venir">
          {upcoming.length ? (
            upcoming.map((i) => {
              const d = daysUntil(i.date);
              const when = d <= 0 ? "aujourd’hui" : d === 1 ? "demain" : `dans ${d} j`;
              const p = getPillar(i.pillar);
              return (
                <div key={i.id} className="mb-2 flex items-center gap-3.5 rounded-2xl bg-surface p-3.5 shadow-[0_0_0_1px_var(--line)]">
                  <span className="h-9 w-1 shrink-0 self-stretch rounded-full" style={{ background: p.colorVar }} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-semibold">{i.title}</div>
                    <div className="mt-0.5 flex items-center gap-2 text-[12.5px] text-ink-soft">
                      <span className="rounded-full px-2 py-0.5 text-[11px] font-bold" style={{ background: `color-mix(in srgb, ${p.colorVar} 16%, transparent)`, color: p.colorVar }}>{ITEM_TYPES[i.type].label}</span>
                      {shortDate(i.date)}
                    </div>
                  </div>
                  <span className="whitespace-nowrap text-[13px] font-bold" style={{ color: d <= 1 ? "var(--destructive)" : "var(--ink-soft)" }}>{when}</span>
                </div>
              );
            })
          ) : (
            <div className="card flex flex-col items-center px-5 py-8 text-center">
              <div className="mb-3.5 grid size-[60px] place-items-center rounded-[18px] bg-bg-alt text-evergreen"><Icon name="check-circle" className="size-[30px]" /></div>
              <h3 className="font-[family-name:var(--font-sans)] text-[15.5px] font-bold">Rien d’urgent</h3>
              <p className="mx-auto mt-1 max-w-[26ch] text-[14px] text-ink-soft">Aucune échéance proche. Profite-en pour avancer sur tes objectifs.</p>
            </div>
          )}
        </Block>
      </div>

      {/* weekly + gpa */}
      <div className="grid gap-4 md:grid-cols-2">
        <Block title="Ta semaine" right={<Link href="/balance" className="text-[13.5px] font-semibold text-evergreen-ink">Détails</Link>}>
          <div className="card p-5">
            <WeeklyBars days={matrix} />
            <Legend ids={PILLARS.slice(0, 5).map((p) => p.id)} />
          </div>
        </Block>

        <Block title="Académique">
          {gpaV != null ? (
            <div className="card flex items-center gap-4 p-5">
              <Ring value={(gpaV / 4) * 100} size={84} stroke={9} color="var(--gold)" big={gpaV.toFixed(2)} caption="/ 4.0" />
              <div>
                <div className="text-[12.5px] font-semibold text-ink-soft">Moyenne (GPA)</div>
                <div className="font-[family-name:var(--font-display)] text-xl font-semibold">{gpaV >= 3.5 ? "Excellent" : gpaV >= 3 ? "Solide" : "En progrès"}</div>
                <Link href="/courses" className="text-[12.5px] font-semibold text-evergreen-ink">{courses.length} cours suivis →</Link>
              </div>
            </div>
          ) : (
            <div className="card flex flex-col items-center px-5 py-8 text-center">
              <div className="mb-3.5 grid size-[60px] place-items-center rounded-[18px] bg-bg-alt text-evergreen"><Icon name="grad" className="size-[30px]" /></div>
              <h3 className="font-[family-name:var(--font-sans)] text-[15.5px] font-bold">Suis ta moyenne</h3>
              <p className="mx-auto mt-1 mb-3.5 max-w-[26ch] text-[14px] text-ink-soft">Ajoute tes cours pour projeter ton GPA.</p>
              <Link href="/courses" className="btn btn-primary btn-sm">Ajouter un cours</Link>
            </div>
          )}
        </Block>
      </div>
    </>
  );
}

function ScoreCard({ ring, label, value, sub }: { ring: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card flex items-center gap-4 p-4.5">
      {ring}
      <div>
        <div className="text-[12.5px] font-semibold text-ink-soft">{label}</div>
        <div className="font-[family-name:var(--font-display)] text-3xl font-semibold leading-none">{value}</div>
        <div className="text-[12.5px] text-ink-faint">{sub}</div>
      </div>
    </div>
  );
}
