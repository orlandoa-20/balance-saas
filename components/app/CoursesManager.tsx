"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { addCourse, deleteCourse } from "@/lib/data/actions";
import type { Course } from "@/lib/types";

const GRADES = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

export function CoursesManager({ courses }: { courses: Course[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [credits, setCredits] = useState(3);
  const [grade, setGrade] = useState("A");
  const [err, setErr] = useState<string | null>(null);

  function add() {
    if (!name.trim()) return setErr("Nom du cours requis.");
    setErr(null);
    start(async () => {
      const r = await addCourse({ name: name.trim(), credits, grade });
      if (r.ok) {
        setName("");
        router.refresh();
      } else setErr(r.error ?? "Erreur");
    });
  }
  function remove(id: string) {
    start(async () => {
      await deleteCourse(id);
      router.refresh();
    });
  }

  return (
    <div className={pending ? "opacity-70" : ""}>
      {/* add form */}
      <div className="card mb-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Cours</label>
            <input className="field-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Algorithmique" />
          </div>
          <div className="w-full sm:w-24">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Crédits</label>
            <input type="number" min={0} max={30} step={0.5} className="field-input" value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
          </div>
          <div className="w-full sm:w-28">
            <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">Note</label>
            <select className="field-input" value={grade} onChange={(e) => setGrade(e.target.value)}>
              {GRADES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <button onClick={add} disabled={pending} className="btn btn-primary">
            <Icon name="plus" className="size-[18px]" /> Ajouter
          </button>
        </div>
        {err && <p role="alert" className="mt-2 text-[13px] font-medium text-destructive">{err}</p>}
      </div>

      {/* list */}
      {courses.length ? (
        <div className="card divide-y divide-[var(--line-soft)] overflow-hidden">
          {courses.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-9 place-items-center rounded-xl bg-bg-alt text-evergreen-ink">
                <Icon name="book" className="size-[18px]" />
              </span>
              <div className="flex-1">
                <div className="font-semibold">{c.name}</div>
                <div className="text-[12.5px] text-ink-soft">{c.credits} crédits</div>
              </div>
              <span className="rounded-full bg-bg-alt px-3 py-1 text-[13px] font-bold tabular-nums">{c.grade ?? "—"}</span>
              <button onClick={() => remove(c.id)} aria-label="Supprimer" className="rounded-lg p-2 text-ink-faint transition hover:text-destructive">
                <Icon name="trash" className="size-[18px]" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="card px-5 py-8 text-center text-[14px] text-ink-soft">
          Ajoute tes cours pour suivre ta moyenne et projeter ton GPA.
        </div>
      )}
    </div>
  );
}
