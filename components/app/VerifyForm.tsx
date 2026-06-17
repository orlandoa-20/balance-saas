"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/Icon";
import { createClient } from "@/lib/supabase/client";
import { requestEmailVerification, submitIdUpload } from "@/lib/data/verification";
import type { VerifyStatus } from "@/lib/types";

export function VerifyForm({ status }: { status: VerifyStatus }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(status === "rejected");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (status === "verified") {
    return (
      <div className="card flex items-center gap-3.5 p-5">
        <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
          <Icon name="check-circle" className="size-[22px]" />
        </span>
        <div>
          <div className="font-bold">Statut étudiant vérifié ✓</div>
          <div className="text-[13.5px] text-ink-soft">Tu profites des tarifs étudiants.</div>
        </div>
      </div>
    );
  }
  if (status === "pending") {
    return (
      <div className="card flex items-center gap-3.5 p-5">
        <span className="grid size-11 place-items-center rounded-2xl text-white" style={{ background: "linear-gradient(155deg,var(--gold),var(--clay))" }}>
          <Icon name="clock" className="size-[22px]" />
        </span>
        <div>
          <div className="font-bold">Vérification en cours</div>
          <div className="text-[13.5px] text-ink-soft">Un administrateur examine ta pièce. Tu seras notifié·e.</div>
        </div>
      </div>
    );
  }

  function viaEmail() {
    setErr(null);
    setMsg(null);
    start(async () => {
      const res = await requestEmailVerification();
      if (!res.ok) return setErr(res.error ?? "Erreur");
      if (res.verified) {
        setMsg("Vérifié via ton email universitaire ✓");
        router.refresh();
      } else {
        setShowUpload(true);
        setMsg("Ton domaine n'est pas reconnu. Envoie ta carte étudiante ci-dessous.");
      }
    });
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setErr(null);
    setMsg(null);
    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Non authentifié.");
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      const { error: upErr } = await supabase.storage.from("student-ids").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const res = await submitIdUpload(path);
      if (!res.ok) throw new Error(res.error);
      setMsg("Pièce envoyée. Vérification en cours ✓");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Échec de l'envoi.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="card p-5">
      <p className="mb-4 text-[14px] text-ink-soft">
        Deux options : la vérification instantanée via ton <strong>email universitaire</strong>,
        ou l&apos;envoi de ta <strong>carte étudiante</strong> (revue manuelle).
      </p>

      <button onClick={viaEmail} disabled={pending} className="btn btn-primary btn-block">
        <Icon name="mail" className="size-[18px]" /> {pending ? "…" : "Vérifier via mon email universitaire"}
      </button>

      {showUpload && (
        <label className="mt-3 flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-line bg-surface-2 p-6 text-center transition hover:border-evergreen">
          <Icon name="shield" className="size-7 text-evergreen" />
          <span className="text-[14px] font-semibold">{uploading ? "Envoi…" : "Envoyer ma carte étudiante / certificat de scolarité"}</span>
          <span className="text-[12.5px] text-ink-faint">JPG, PNG ou PDF</span>
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={onFile} disabled={uploading} />
        </label>
      )}

      {msg && <p className="mt-3 text-[13px] font-medium text-evergreen-ink">{msg}</p>}
      {err && <p role="alert" className="mt-3 text-[13px] font-medium text-destructive">{err}</p>}
    </div>
  );
}
