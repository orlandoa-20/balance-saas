import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/queries";
import { AppShell } from "@/components/app/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let profile;
  try {
    profile = await getProfile();
  } catch {
    redirect("/login");
  }
  if (!profile) redirect("/login");

  // Suspended users are blocked from the whole app immediately.
  if (profile.suspended) {
    return (
      <div className="grid min-h-dvh place-items-center px-6 text-center">
        <div className="max-w-md">
          <h1 className="text-2xl font-semibold">Compte suspendu</h1>
          <p className="mt-2 text-ink-soft">
            Ton accès a été suspendu. Contacte le support si tu penses qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
          <form action="/auth/signout" method="post" className="mt-6">
            <button className="btn btn-ghost" type="submit">Se déconnecter</button>
          </form>
        </div>
      </div>
    );
  }

  if (!profile.onboarded) redirect("/onboarding");

  return <AppShell profile={profile}>{children}</AppShell>;
}
