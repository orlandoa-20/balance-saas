import { getWeekItems } from "@/lib/data/queries";
import { weekDays, toKey, dayIndex, WEEKDAYS } from "@/lib/date";
import { AppHeader } from "@/components/app/ui";
import { MiniItem } from "@/components/app/MiniItem";
import { AddItem } from "@/components/app/AddItem";

export const metadata = { title: "Planning" };

export default async function PlannerPage() {
  const week = await getWeekItems();
  const days = weekDays();
  const ti = dayIndex();

  return (
    <>
      <AppHeader eyebrow="Planning" title="Ta semaine" sub="Vue d’ensemble. Touche une carte à cocher pour la valider." />
      <div className="grid gap-2.5 lg:grid-cols-7">
        {days.map((d, i) => {
          const k = toKey(d);
          const items = week
            .filter((it) => it.date === k)
            .sort((a, b) => (a.start_time ?? "99").localeCompare(b.start_time ?? "99"));
          const isToday = i === ti;
          return (
            <div
              key={k}
              className={`flex min-h-[132px] flex-col rounded-2xl bg-surface p-2.5 ${
                isToday ? "shadow-[0_0_0_2px_var(--evergreen)]" : "shadow-[0_0_0_1px_var(--line)]"
              }`}
            >
              <div className="mb-2 text-center">
                <div className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">{WEEKDAYS[i]}</div>
                <div className={`font-[family-name:var(--font-display)] text-lg font-semibold ${isToday ? "text-evergreen-ink" : ""}`}>
                  {d.getDate()}
                </div>
              </div>
              {items.map((it) => (
                <MiniItem key={it.id} item={it} />
              ))}
              <div className="mt-auto pt-1.5">
                <AddItem as="day" defaultDate={k} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
