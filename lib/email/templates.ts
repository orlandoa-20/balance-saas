import "server-only";

const SITE = () => process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

function shell(heading: string, body: string, cta?: { label: string; href: string }): string {
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F5F1E8;font-family:Inter,Segoe UI,Arial,sans-serif;color:#2B2823">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px">
    <div style="font-family:Georgia,serif;font-weight:700;font-size:22px;color:#3E5A45;margin-bottom:24px">⚖ BalanceU</div>
    <div style="background:#fff;border-radius:22px;padding:32px;box-shadow:0 12px 28px -10px rgba(43,40,35,.16)">
      <h1 style="font-family:Georgia,serif;font-size:26px;margin:0 0 12px;color:#2B2823">${heading}</h1>
      <div style="font-size:15px;line-height:1.6;color:#6A6356">${body}</div>
      ${cta ? `<a href="${cta.href}" style="display:inline-block;margin-top:22px;background:#3E5A45;color:#FBF8F1;text-decoration:none;font-weight:600;padding:13px 24px;border-radius:999px">${cta.label}</a>` : ""}
    </div>
    <p style="text-align:center;color:#9B9384;font-size:12px;margin-top:24px">BalanceU · Équilibre ta vie étudiante</p>
  </div></body></html>`;
}

export function welcomeEmail(name: string) {
  return {
    subject: "Bienvenue dans BalanceU 🌿",
    html: shell(
      `Bienvenue, ${name} !`,
      `Ton espace est prêt. BalanceU réunit tes 7 domaines de vie — études, santé, travail, sport, relations, finances, développement — dans un planner clair et bienveillant.<br/><br/>Commence par ajouter tes cours et tes premières échéances : ton score d'équilibre se mettra à vivre.`,
      { label: "Ouvrir mon tableau de bord", href: `${SITE()}/dashboard` }
    ),
  };
}

export function subscriptionEmail(name: string, tier: string) {
  return {
    subject: `Ton abonnement ${tier} est actif ✓`,
    html: shell(
      `Merci ${name} !`,
      `Ton abonnement <strong>${tier}</strong> est désormais actif. Tu profites de toutes les fonctionnalités correspondantes.<br/><br/>Tu peux gérer ton abonnement (factures, changement de formule, résiliation) à tout moment depuis tes réglages.`,
      { label: "Gérer mon abonnement", href: `${SITE()}/settings` }
    ),
  };
}

// Optional branded variants if Resend is wired as Supabase SMTP:
export function verificationEmail(confirmUrl: string) {
  return {
    subject: "Confirme ton adresse email",
    html: shell("Confirme ton email", "Clique ci-dessous pour activer ton compte BalanceU.", { label: "Confirmer", href: confirmUrl }),
  };
}
export function passwordResetEmail(resetUrl: string) {
  return {
    subject: "Réinitialise ton mot de passe",
    html: shell("Mot de passe oublié ?", "Clique ci-dessous pour choisir un nouveau mot de passe. Ce lien expire bientôt.", { label: "Réinitialiser", href: resetUrl }),
  };
}
