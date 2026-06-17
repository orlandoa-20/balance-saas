import { getProfile } from "@/lib/data/queries";
import { VerifyForm } from "@/components/app/VerifyForm";

export const metadata = { title: "Vérification étudiante" };

export default async function VerifyPage() {
  const profile = await getProfile();
  if (!profile) return null;

  return (
    <>
      <div className="mb-6">
        <div className="eyebrow">Statut étudiant</div>
        <h1 className="mt-1.5 text-[28px]">Vérification étudiante</h1>
        <p className="mt-1 text-[14.5px] text-ink-soft">Débloque les tarifs étudiants en confirmant ton inscription.</p>
      </div>
      <VerifyForm status={profile.verify_status} />
    </>
  );
}
