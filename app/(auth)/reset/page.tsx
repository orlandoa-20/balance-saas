"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Email invalide.");
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return setErr("Supabase non configuré (.env.local).");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${location.origin}/auth/confirm?next=/update-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[30px] bg-surface p-8 shadow-[var(--sh-lg)]">
      <h1 className="text-center text-[26px]">Mot de passe oublié</h1>
      <p className="mb-5 mt-1.5 text-center text-[14.5px] text-ink-soft">
        On t&apos;envoie un lien pour le réinitialiser.
      </p>
      {sent ? (
        <p className="rounded-2xl bg-surface-2 p-4 text-center text-sm text-evergreen-ink">
          Si un compte existe pour <strong>{email}</strong>, un lien vient d&apos;être envoyé ✉️
        </p>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <div className="relative mb-4 flex items-center">
            <Icon name="mail" className="absolute left-3.5 size-[18px] text-ink-faint" />
            <input className="field-input pl-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@univ.fr" autoComplete="email" />
          </div>
          {err && <p role="alert" className="mb-3 text-[13px] font-medium text-destructive">{err}</p>}
          <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
            {loading ? "…" : "Envoyer le lien"}
          </button>
        </form>
      )}
      <Link href="/login" className="mt-4 block text-center text-sm font-bold text-evergreen-ink">
        Retour à la connexion
      </Link>
    </div>
  );
}
