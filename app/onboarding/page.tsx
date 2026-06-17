import { redirect } from "next/navigation";
import { getProfile } from "@/lib/data/queries";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import type { Profile } from "@/lib/types";

export const metadata = { title: "Bienvenue" };

export default async function OnboardingPage() {
  let profile: Profile | null = null;
  try {
    profile = await getProfile();
  } catch {
    // Supabase unreachable/unconfigured → treat as logged out
    redirect("/login");
  }
  // redirects live OUTSIDE the try (redirect() throws a control-flow signal)
  if (!profile) redirect("/login");
  if (profile.onboarded) redirect("/dashboard");

  return <OnboardingFlow defaultName={profile.full_name ?? ""} />;
}
