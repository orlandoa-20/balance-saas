import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PILLARS } from "@/lib/constants/pillars";

const FEATURES = [
  { ic: "calendar", color: "var(--p-academics)", h: "Un planner pour ta vie entière", p: "Cours, tâches, examens, shifts, moments perso — tout au même endroit, ajouté en quelques secondes." },
  { ic: "scale", color: "var(--p-health)", h: "Un vrai score d'équilibre", p: "BalanceU compare ton temps réel à TES priorités sur 7 domaines de vie. Trop, c'est aussi un déséquilibre." },
  { ic: "compass", color: "var(--p-relationships)", h: "Un coach, pas un juge", p: "Détection de surcharge, pauses suggérées, révisions réparties avant les exams. Toujours bienveillant." },
  { ic: "chart", color: "var(--p-finances)", h: "Des progrès qui donnent envie", p: "Séries, rapports hebdo et graphiques clairs : tu vois enfin où part ton temps — et tu reviens chaque jour." },
];

function HeroMock() {
  const bars = [
    { label: "Études", w: 88, c: "var(--p-academics)" },
    { label: "Santé", w: 70, c: "var(--p-health)" },
    { label: "Sport", w: 52, c: "var(--p-sports)" },
    { label: "Relations", w: 74, c: "var(--p-relationships)" },
    { label: "Finances", w: 30, c: "var(--p-finances)" },
  ];
  const C = 2 * Math.PI * 40;
  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="card rounded-[30px] p-6 shadow-[var(--sh-lg)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-display)] text-lg font-semibold">Cette semaine</div>
            <div className="text-xs text-ink-faint">Lun 16 — Dim 22 juin</div>
          </div>
          <Icon name="settings" className="size-[18px] text-ink-faint" />
        </div>
        <div className="mb-4 flex items-center gap-4 rounded-2xl bg-surface-2 p-4">
          <div className="relative size-[92px] shrink-0">
            <svg viewBox="0 0 92 92" className="-rotate-90">
              <circle cx="46" cy="46" r="40" fill="none" stroke="var(--bg-alt)" strokeWidth="10" />
              <circle cx="46" cy="46" r="40" fill="none" stroke="var(--evergreen)" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - 0.78)} />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <span className="font-[family-name:var(--font-display)] text-2xl font-semibold">78</span>
            </div>
          </div>
          <div>
            <div className="font-[family-name:var(--font-display)] text-xl font-semibold">Bel équilibre</div>
            <div className="text-[13px] text-ink-soft">Tu protèges bien ton temps santé &amp; relations cette semaine.</div>
          </div>
        </div>
        <div className="flex flex-col gap-[9px]">
          {bars.map((b) => (
            <div key={b.label} className="flex items-center gap-[10px]">
              <span className="size-[10px] shrink-0 rounded-full" style={{ background: b.c }} />
              <span className="w-[74px] text-[12.5px] text-ink-soft">{b.label}</span>
              <span className="h-[9px] flex-1 overflow-hidden rounded-full bg-bg-alt">
                <span className="block h-full rounded-full" style={{ width: `${b.w}%`, background: b.c }} />
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -right-3 -top-5 flex items-center gap-[10px] rounded-2xl border border-line bg-surface px-3.5 py-3 text-[13px] font-semibold shadow-[var(--sh-md)]">
        <span className="grid size-[34px] place-items-center rounded-[10px] text-white" style={{ background: "var(--gold)" }}>
          <Icon name="flame" className="size-[18px]" />
        </span>
        Série de 8 jours
      </div>
    </div>
  );
}

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "BalanceU",
  applicationCategory: "EducationApplication",
  operatingSystem: "Web, iOS, Android",
  description:
    "Planner étudiant et coach d'équilibre de vie sur 7 domaines : études, santé, travail, sport, relations, finances, développement.",
  offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", ratingCount: "1200" },
};

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }} />
      {/* nav */}
      <header className="sticky top-0 z-40 border-b border-transparent bg-[color-mix(in_srgb,var(--bg)_82%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-[70px] max-w-[1120px] items-center justify-between gap-4 px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid size-[38px] place-items-center rounded-xl text-[var(--on-primary)] shadow-[var(--sh-sm)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
              <Icon name="logo" className="size-[21px]" />
            </span>
            <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">BalanceU</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#features" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-2 hover:text-ink">Fonctionnalités</a>
            <a href="#pillars" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface-2 hover:text-ink">Domaines</a>
          </nav>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link href="/login" className="btn btn-ghost btn-sm hidden sm:inline-flex">Se connecter</Link>
            <Link href="/signup" className="btn btn-primary btn-sm">Commencer</Link>
          </div>
        </div>
      </header>

      <main>
        {/* hero */}
        <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 pb-9 pt-16 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="pill"><Icon name="cloud-off" className="size-[15px] text-evergreen" />Hors-ligne</span>
              <span className="pill"><Icon name="shield" className="size-[15px] text-evergreen" />100% privé</span>
              <span className="pill"><Icon name="phone" className="size-[15px] text-evergreen" />Mobile-first</span>
            </div>
            <h1 className="text-[clamp(38px,6.2vw,62px)] font-semibold leading-[1.05] tracking-[-0.03em]">
              Équilibre ta vie étudiante,<br />
              <span className="italic text-clay">une semaine sereine</span> à la fois.
            </h1>
            <p className="mt-5 max-w-[46ch] text-[18px] text-ink-soft">
              Études, travail, sport, santé, finances, relations, développement personnel —
              BalanceU réunit tes 7 domaines de vie dans un planner clair et bienveillant, jamais culpabilisant.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn btn-primary btn-lg">Commencer gratuitement <Icon name="arrow-right" className="size-[18px]" /></Link>
              <Link href="/login" className="btn btn-ghost btn-lg">Se connecter</Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
              <span className="flex gap-px">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} name="star" fill className="size-[17px] text-gold" />
                ))}
              </span>
              <span><strong className="font-semibold text-ink">4,9/5</strong> · plébiscité par <strong className="font-semibold text-ink">12 000+</strong> étudiants</span>
            </div>
          </div>
          <HeroMock />
        </section>

        {/* features */}
        <section id="features" className="mx-auto max-w-[1120px] px-6 py-16">
          <div className="mx-auto mb-10 max-w-[640px] text-center">
            <span className="eyebrow">Pensé pour ta vie entière</span>
            <h2 className="mt-3.5 text-[clamp(28px,4.5vw,40px)]">Plus qu&apos;un agenda. Un coach d&apos;équilibre.</h2>
            <p className="mt-3 text-[16.5px] text-ink-soft">Quatre piliers qui transforment des to-do lists en une routine durable.</p>
          </div>
          <div className="grid gap-[18px] sm:grid-cols-2">
            {FEATURES.map((f) => (
              <article key={f.h} className="card p-6 transition hover:-translate-y-1 hover:shadow-[var(--sh-md)]">
                <div className="mb-4 grid size-[50px] place-items-center rounded-[15px] text-white" style={{ background: f.color }}>
                  <Icon name={f.ic} className="size-[30px]" />
                </div>
                <h3 className="text-xl">{f.h}</h3>
                <p className="mt-1.5 text-[14.5px] text-ink-soft">{f.p}</p>
              </article>
            ))}
          </div>
        </section>

        {/* pillars */}
        <section id="pillars" className="mx-auto max-w-[1120px] px-6 py-16">
          <div className="mx-auto mb-10 max-w-[640px] text-center">
            <span className="eyebrow">Les 7 domaines de vie</span>
            <h2 className="mt-3.5 text-[clamp(28px,4.5vw,40px)]">Tout ce qui compte, au même endroit.</h2>
          </div>
          <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
            {PILLARS.map((p) => (
              <article key={p.id} className="card p-5 transition hover:-translate-y-0.5">
                <div className="mb-3 grid size-11 place-items-center rounded-[13px] text-white" style={{ background: p.colorVar }}>
                  <Icon name={p.icon} className="size-6" />
                </div>
                <h3 className="font-[family-name:var(--font-sans)] text-[15.5px] font-bold">{p.label}</h3>
                <p className="mt-1 text-[13px] text-ink-soft">{p.blurb}</p>
              </article>
            ))}
          </div>
        </section>

        {/* final cta */}
        <section className="mx-auto max-w-[1120px] px-6">
          <div className="my-10 rounded-[30px] px-8 py-14 text-center shadow-[var(--sh-lg)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))", color: "var(--on-primary)" }}>
            <h2 className="text-[clamp(26px,4vw,38px)] text-[color:var(--on-primary)]">Ta semaine la plus équilibrée commence maintenant.</h2>
            <p className="mx-auto mt-3 max-w-[34ch] text-[16px] opacity-90">Gratuit, sans carte bancaire, prêt en 60 secondes.</p>
            <Link href="/signup" className="btn btn-lg mt-6 bg-surface text-evergreen-ink hover:brightness-[1.03]">Créer mon espace <Icon name="arrow-right" className="size-[18px]" /></Link>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-[1120px] border-t border-line px-6 py-10 text-[13px] text-ink-faint">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} BalanceU. Conçu pour les étudiants.</span>
          <span>Études · Santé · Travail · Sport · Relations · Finances · Développement</span>
        </div>
      </footer>
    </div>
  );
}
