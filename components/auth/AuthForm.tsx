"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Icon } from "@/components/Icon";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function configured() {
    return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setNotice(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr("Email invalide.");
    if (password.length < 6) return setErr("Mot de passe : 6 caractères minimum.");
    if (isSignup && !name.trim()) return setErr("Indique ton prénom.");
    if (!configured()) {
      return setErr("Supabase n'est pas encore configuré (ajoute tes clés dans .env.local).");
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${location.origin}/auth/callback?next=/onboarding`,
          },
        });
        if (error) throw error;
        setNotice("Vérifie ta boîte mail pour confirmer ton compte ✉️");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  }

  async function oauth(provider: "google" | "apple") {
    setErr(null);
    if (!configured()) return setErr("Supabase n'est pas encore configuré (.env.local).");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) setErr(error.message);
  }

  return (
    <div className="w-full max-w-[420px] rounded-[30px] bg-surface p-8 shadow-[var(--sh-lg)]">
      <Link href="/" className="mb-4 flex items-center justify-center gap-2.5">
        <span className="grid size-[38px] place-items-center rounded-xl text-[var(--on-primary)]" style={{ background: "linear-gradient(155deg,var(--evergreen-2),var(--evergreen))" }}>
          <Icon name="logo" className="size-[21px]" />
        </span>
        <span className="font-[family-name:var(--font-display)] text-xl font-semibold">BalanceU</span>
      </Link>
      <h1 className="text-center text-[26px]">{isSignup ? "Crée ton espace" : "Content de te revoir"}</h1>
      <p className="mb-5 mt-1.5 text-center text-[14.5px] text-ink-soft">
        {isSignup ? "Gratuit, prêt en 60 secondes." : "Reprends là où tu t'es arrêté."}
      </p>

      <div className="mb-4 flex flex-col gap-2.5">
        <button type="button" onClick={() => oauth("google")} className="btn btn-ghost btn-block">
          <Icon name="google" className="size-[18px]" /> Continuer avec Google
        </button>
        <button type="button" onClick={() => oauth("apple")} className="btn btn-ghost btn-block">
          <Icon name="apple" fill className="size-[18px]" /> Continuer avec Apple
        </button>
      </div>

      <div className="my-4 flex items-center gap-3 text-[12.5px] text-ink-faint before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
        ou par email
      </div>

      <form onSubmit={onSubmit} noValidate>
        {isSignup && (
          <Field label="Prénom" icon="user">
            <input className="field-input pl-11" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex" autoComplete="given-name" />
          </Field>
        )}
        <Field label="Email" icon="mail">
          <input className="field-input pl-11" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="toi@univ.fr" autoComplete="email" />
        </Field>
        <Field label="Mot de passe" icon="lock">
          <input className="field-input pl-11 pr-11" type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete={isSignup ? "new-password" : "current-password"} />
          <button type="button" onClick={() => setShowPw((s) => !s)} aria-label="Afficher le mot de passe" className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-ink-faint">
            <Icon name={showPw ? "eye-off" : "eye"} className="size-[18px]" />
          </button>
        </Field>

        {err && <p role="alert" className="mb-3 text-[13px] font-medium text-destructive">{err}</p>}
        {notice && <p className="mb-3 text-[13px] font-medium text-evergreen-ink">{notice}</p>}

        <button type="submit" disabled={loading} className="btn btn-primary btn-block btn-lg">
          {loading ? "…" : isSignup ? "Créer mon compte" : "Se connecter"}
        </button>
      </form>

      {!isSignup && (
        <Link href="/reset" className="mt-4 block text-center text-[13.5px] text-ink-soft hover:text-ink">
          Mot de passe oublié ?
        </Link>
      )}
      <p className="mt-4 text-center text-sm text-ink-soft">
        {isSignup ? "Déjà un compte ? " : "Pas encore de compte ? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-bold text-evergreen-ink">
          {isSignup ? "Se connecter" : "Créer un compte"}
        </Link>
      </p>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[13px] font-semibold text-ink-soft">{label}</label>
      <div className="relative flex items-center">
        <Icon name={icon} className="absolute left-3.5 size-[18px] text-ink-faint" />
        {children}
      </div>
    </div>
  );
}
