"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (password.length < 6) return setErr("6 caractères minimum.");
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      router.push("/dashboard");
      router.refresh();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Erreur. Le lien a peut-être expiré.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[420px] rounded-[30px] bg-surface p-8 shadow-[var(--sh-lg)]">
      <h1 className="text-center text-[26px]">Nouveau mot de passe</h1>
      <p className="mb-5 mt-1.5 text-center text-[14.5px] text-ink-soft">Choisis un nouveau mot de passe sécurisé.</p>
      <form onSubmit={onSubmit} noValidate>
        <div className="relative mb-4 flex items-center">
          <Icon name="lock" className="absolute left-3.5 size-[18px] text-ink-faint" />
          <input className="field-input pl-11 pr-11" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label="Afficher" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-ink-faint">
            <Icon name={show ? "eye-off" : "eye"} className="size-[18px]" />
          </button>
        </div>
        {err && <p role="alert" className="mb-3 text-[13px] font-medium text-destructive">{err}</p>}
        <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
          {loading ? "…" : "Mettre à jour"}
        </button>
      </form>
    </div>
  );
}
