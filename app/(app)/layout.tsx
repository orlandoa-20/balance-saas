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
  if (!profile.onboarded) redirect("/onboarding");

  return <AppShell profile={profile}>{children}</AppShell>;
}
