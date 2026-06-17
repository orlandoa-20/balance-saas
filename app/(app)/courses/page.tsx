import { getCourses } from "@/lib/data/queries";
import { gpa } from "@/lib/balance";
import { Ring } from "@/components/charts";
import { CoursesManager } from "@/components/app/CoursesManager";

export const metadata = { title: "Cours & GPA" };

export default async function CoursesPage() {
  const courses = await getCourses();
  const gpaV = gpa(courses);

  return (
    <>
      <div className="mb-6">
        <div className="eyebrow">Module académique</div>
        <h1 className="mt-1.5 text-[28px]">Cours &amp; moyenne</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">Suis tes cours et projette ton GPA (échelle /4.0).</p>
      </div>

      {gpaV != null && (
        <div className="card mb-5 flex items-center gap-5 p-5">
          <Ring value={(gpaV / 4) * 100} size={96} stroke={11} color="var(--gold)" big={gpaV.toFixed(2)} caption="/ 4.0" />
          <div>
            <div className="text-[12.5px] font-semibold text-ink-soft">Moyenne générale</div>
            <div className="font-[family-name:var(--font-display)] text-2xl font-semibold">
              {gpaV >= 3.5 ? "Excellent" : gpaV >= 3 ? "Solide" : gpaV >= 2 ? "En progrès" : "À soutenir"}
            </div>
            <div className="text-[13px] text-ink-faint">{courses.length} cours · {courses.reduce((s, c) => s + c.credits, 0)} crédits</div>
          </div>
        </div>
      )}

      <CoursesManager courses={courses} />
    </>
  );
}
