import { Icon } from "@/components/Icon";
import { requireAdmin, adminStats, listUsers, listPendingVerifications, listFlags } from "@/lib/admin/data";
import { adminSetVerify, adminToggleSuspend, adminSetPlan, adminToggleFlag } from "@/lib/admin/actions";

export default async function AdminPage() {
  const { admin } = await requireAdmin();
  const [stats, users, pending, flags] = await Promise.all([
    adminStats(admin),
    listUsers(admin),
    listPendingVerifications(admin),
    listFlags(admin),
  ]);

  return (
    <>
      {/* stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon="users" label="Étudiants" value={stats.users} />
        <Stat icon="shield" label="Vérifiés" value={stats.verified} />
        <Stat icon="clock" label="En attente" value={stats.pending} />
        <Stat icon="sparkles" label="Abonnés payants" value={stats.paying} />
      </div>

      {/* pending verifications */}
      <section className="mb-7">
        <h2 className="mb-3 text-[19px]">Vérifications en attente</h2>
        {pending.length ? (
          <div className="card divide-y divide-[var(--line-soft)] overflow-hidden">
            {pending.map((v) => (
              <div key={v.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="font-semibold">{v.profiles?.full_name ?? v.user_id.slice(0, 8)}</div>
                  <div className="text-[12.5px] text-ink-soft">{v.method === "email_domain" ? "Email universitaire" : "Carte étudiante"} · {v.evidence_url ?? "—"}</div>
                </div>
                <form action={adminSetVerify.bind(null, v.user_id, "verified")}>
                  <button className="btn btn-primary btn-sm" type="submit">Approuver</button>
                </form>
                <form action={adminSetVerify.bind(null, v.user_id, "rejected")}>
                  <button className="btn btn-ghost btn-sm" type="submit">Rejeter</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="card px-5 py-6 text-center text-[14px] text-ink-soft">Aucune vérification en attente.</div>
        )}
      </section>

      {/* users */}
      <section className="mb-7">
        <h2 className="mb-3 text-[19px]">Utilisateurs ({stats.users})</h2>
        <div className="card divide-y divide-[var(--line-soft)] overflow-hidden">
          {users.map((u) => (
            <div key={u.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-[160px] flex-1">
                <div className="flex items-center gap-2 font-semibold">
                  {u.full_name ?? u.id.slice(0, 8)}
                  {u.role === "admin" && <span className="rounded-full bg-bg-alt px-2 py-0.5 text-[10px] font-bold uppercase">admin</span>}
                  {u.suspended && <span className="rounded-full bg-[color-mix(in_srgb,var(--destructive)_14%,transparent)] px-2 py-0.5 text-[10px] font-bold uppercase text-destructive">suspendu</span>}
                </div>
                <div className="text-[12.5px] text-ink-soft">{u.school || "—"} · {u.verify_status}</div>
              </div>
              <div className="flex items-center gap-1">
                {(["free", "plus", "pro"] as const).map((t) => (
                  <form key={t} action={adminSetPlan.bind(null, u.id, t)}>
                    <button type="submit" className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${u.plan === t ? "bg-evergreen text-[var(--on-primary)]" : "bg-surface-2 text-ink-soft"}`}>{t}</button>
                  </form>
                ))}
              </div>
              <form action={adminToggleSuspend.bind(null, u.id, !u.suspended)}>
                <button type="submit" className="btn btn-ghost btn-sm">{u.suspended ? "Réactiver" : "Suspendre"}</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* feature flags */}
      <section className="mb-6">
        <h2 className="mb-3 text-[19px]">Feature flags</h2>
        {flags.length ? (
          <div className="card divide-y divide-[var(--line-soft)] overflow-hidden">
            {flags.map((f) => (
              <div key={f.key} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1">
                  <div className="font-semibold">{f.key}</div>
                  {f.description && <div className="text-[12.5px] text-ink-soft">{f.description}</div>}
                </div>
                <form action={adminToggleFlag.bind(null, f.key, !f.enabled)}>
                  <button type="submit" className={`rounded-full px-3 py-1 text-[12px] font-bold ${f.enabled ? "bg-evergreen text-[var(--on-primary)]" : "bg-surface-2 text-ink-soft"}`}>
                    {f.enabled ? "ON" : "OFF"}
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <div className="card px-5 py-6 text-center text-[14px] text-ink-soft">Aucun flag défini.</div>
        )}
      </section>
    </>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div className="card p-4">
      <div className="mb-1.5 grid size-9 place-items-center rounded-xl bg-bg-alt text-evergreen-ink">
        <Icon name={icon} className="size-[18px]" />
      </div>
      <div className="font-[family-name:var(--font-display)] text-2xl font-semibold">{value}</div>
      <div className="text-[12.5px] text-ink-soft">{label}</div>
    </div>
  );
}
