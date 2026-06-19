import Link from "next/link";
import { Icon } from "@/components/Icon";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getProfile } from "@/lib/data/queries";
import { getActivePrices, getSubscription, type PriceRow } from "@/lib/data/billing";
import { checkout, billingPortal } from "@/lib/stripe/checkout";
import { STRIPE_PRODUCTS, type Tier, type Interval } from "@/lib/stripe/products";

export const metadata = { title: "Profil & réglages" };

const PLAN_LABEL: Record<string, string> = { free: "Free", plus: "Plus", pro: "Pro" };
const TIER_FEATURES: Record<Tier, string[]> = {
  plus: ["Tâches & plannings illimités", "Sync calendrier (iCal / Google)", "Tous les graphiques", "Rapports hebdo & mensuels"],
  pro: ["Tout Plus, plus :", "Coach IA & plans d’étude", "Prévision de charge & burnout", "Projection de moyenne (GPA)", "Support prioritaire"],
};

function findTier(productId: string): { tier: Tier; interval: Interval } | null {
  for (const [tier, ivs] of Object.entries(STRIPE_PRODUCTS) as [Tier, Record<Interval, string>][]) {
    for (const [interval, pid] of Object.entries(ivs) as [Interval, string][]) {
      if (pid === productId) return { tier, interval };
    }
  }
  return null;
}
function money(amount: number | null, currency: string) {
  if (amount == null) return "—";
  return `${(amount / 100).toFixed(2).replace(".", ",")} ${currency.toUpperCase() === "EUR" ? "€" : currency.toUpperCase()}`;
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout_error?: string; checkout?: string }>;
}) {
  const sp = await searchParams;
  const [profile, prices, sub] = await Promise.all([getProfile(), getActivePrices(), getSubscription()]);
  if (!profile) return null;

  const initial = (profile.full_name ?? "T").trim().charAt(0).toUpperCase();
  const byTier: Record<Tier, Partial<Record<Interval, PriceRow>>> = { plus: {}, pro: {} };
  for (const p of prices) {
    const t = findTier(p.product_id);
    if (t) byTier[t.tier][t.interval] = p;
  }
  const hasPrices = prices.length > 0;

  return (
    <>
      <div className="mb-6">
        <div className="eyebrow">Profil</div>
        <h1 className="mt-1.5 text-[28px]">Toi &amp; tes réglages</h1>
      </div>

      {sp.checkout_error && (
        <div className="mb-5 rounded-2xl bg-[color-mix(in_srgb,var(--destructive)_9%,var(--surface))] p-4 text-[14px] font-medium text-destructive shadow-[0_0_0_1px_color-mix(in_srgb,var(--destructive)_30%,transparent)]">
          Échec du paiement : {decodeURIComponent(sp.checkout_error)}
        </div>
      )}
      {sp.checkout === "success" && (
        <div className="mb-5 rounded-2xl bg-[color-mix(in_srgb,var(--evergreen)_12%,var(--surface))] p-4 text-[14px] font-medium text-evergreen-ink">
          Paiement réussi — ton abonnement s&apos;active à l&apos;instant. ✓
        </div>
      )}

      {/* profile */}
      <div className="card mb-5 flex items-center gap-4 p-5">
        <span className="grid size-[62px] place-items-center rounded-[20px] font-[family-name:var(--font-display)] text-2xl font-semibold text-[var(--on-primary)]" style={{ background: "linear-gradient(155deg,var(--clay),var(--evergreen))" }}>
          {initial}
        </span>
        <div>
          <div className="font-[family-name:var(--font-display)] text-xl font-semibold">{profile.full_name ?? "Étudiant"}</div>
          <div className="text-[13.5px] text-ink-soft">{profile.school || "Compte étudiant"}</div>
        </div>
      </div>

      {/* subscription */}
      <section className="mb-6">
        <h2 className="mb-3 text-[19px]">Ton abonnement</h2>
        <div className="card mb-3 flex items-center justify-between gap-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: profile.plan === "pro" ? "linear-gradient(155deg,var(--gold),var(--clay))" : "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
              <Icon name={profile.plan === "pro" ? "sparkles" : "leaf"} className="size-[22px]" />
            </span>
            <div>
              <div className="font-semibold">Plan {PLAN_LABEL[profile.plan]}</div>
              {sub ? (
                <div className="text-[13px] text-ink-soft">
                  {sub.cancel_at_period_end ? "Se termine" : "Renouvellement"} le {new Date(sub.current_period_end).toLocaleDateString("fr-FR")}
                </div>
              ) : profile.plan !== "free" ? (
                <div className="text-[13px] text-ink-soft">Abonnement {PLAN_LABEL[profile.plan]} actif</div>
              ) : (
                <div className="text-[13px] text-ink-soft">Gratuit · 15 blocs/semaine</div>
              )}
            </div>
          </div>
          {sub && (
            <form action={billingPortal}>
              <button className="btn btn-ghost btn-sm" type="submit">Gérer</button>
            </form>
          )}
        </div>

        {/* upgrade cards */}
        {profile.plan !== "pro" && (
          hasPrices ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {(["plus", "pro"] as Tier[])
                .filter((t) => t !== profile.plan)
                .map((t) => {
                  const m = byTier[t].month;
                  const y = byTier[t].year;
                  return (
                    <div key={t} className={`card p-5 ${t === "pro" ? "shadow-[0_0_0_2px_var(--evergreen)]" : ""}`}>
                      <div className="font-[family-name:var(--font-display)] text-xl font-semibold">{PLAN_LABEL[t]}</div>
                      <ul className="my-3 flex flex-col gap-2">
                        {TIER_FEATURES[t].map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[14px] text-ink-soft">
                            <Icon name="check" className="mt-0.5 size-[18px] text-evergreen" /> {f}
                          </li>
                        ))}
                      </ul>
                      <div className="flex flex-col gap-2">
                        {m && (
                          <form action={checkout.bind(null, m.id)}>
                            <button className="btn btn-primary btn-block btn-sm" type="submit">{money(m.unit_amount, m.currency)} / mois</button>
                          </form>
                        )}
                        {y && (
                          <form action={checkout.bind(null, y.id)}>
                            <button className="btn btn-ghost btn-block btn-sm" type="submit">
                              {money(y.unit_amount, y.currency)}/an
                              {y.unit_amount != null && <span className="text-ink-soft"> · soit {money(Math.round(y.unit_amount / 12), y.currency)}/mois</span>}
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="card p-5 text-[14px] text-ink-soft">
              Les offres apparaîtront une fois Stripe configuré et le webhook synchronisé
              (<code>stripe listen</code> + produits Plus/Pro). Voir <code>ARCHITECTURE.md</code>.
            </div>
          )
        )}
      </section>

      {/* settings */}
      <section className="mb-6">
        <h2 className="mb-3 text-[19px]">Réglages</h2>
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3.5 border-b border-[var(--line-soft)] px-4 py-3.5">
            <Icon name="moon" className="size-[20px] text-evergreen-ink" />
            <span className="flex-1 text-[14.5px] font-semibold">Thème clair / sombre</span>
            <ThemeToggle />
          </div>
          <Link href="/verify" className="flex items-center gap-3.5 border-b border-[var(--line-soft)] px-4 py-3.5 transition hover:bg-surface-2">
            <Icon name="shield" className="size-[20px] text-evergreen-ink" />
            <span className="flex-1 text-[14.5px] font-semibold">Vérification étudiante</span>
            <span className="text-[13px] text-ink-soft">{profile.verify_status === "verified" ? "Vérifié ✓" : "À faire"}</span>
            <Icon name="chevron-right" className="size-[18px] text-ink-faint" />
          </Link>
          {profile.role === "admin" && (
            <Link href="/admin" className="flex items-center gap-3.5 border-b border-[var(--line-soft)] px-4 py-3.5 transition hover:bg-surface-2">
              <Icon name="settings" className="size-[20px] text-evergreen-ink" />
              <span className="flex-1 text-[14.5px] font-semibold">Administration</span>
              <Icon name="chevron-right" className="size-[18px] text-ink-faint" />
            </Link>
          )}
          <form action="/auth/signout" method="post">
            <button type="submit" className="flex w-full items-center gap-3.5 px-4 py-3.5 text-left transition hover:bg-surface-2">
              <Icon name="logout" className="size-[20px] text-destructive" />
              <span className="flex-1 text-[14.5px] font-semibold text-destructive">Se déconnecter</span>
            </button>
          </form>
        </div>
      </section>
    </>
  );
}
