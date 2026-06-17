import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "BalanceU — Équilibre ta vie étudiante",
    template: "%s · BalanceU",
  },
  description:
    "BalanceU aide les étudiants à équilibrer études, travail, sport, santé, finances, relations et développement personnel grâce à une planification claire et bienveillante.",
  applicationName: "BalanceU",
  keywords: ["planner étudiant", "équilibre de vie", "productivité", "GPA", "study planner"],
  openGraph: {
    type: "website",
    siteName: "BalanceU",
    title: "BalanceU — Équilibre ta vie étudiante",
    description:
      "Plus qu'un agenda : un coach d'équilibre pour tes 7 domaines de vie. Planifie, équilibre et progresse, sereinement.",
    url: SITE,
  },
  twitter: {
    card: "summary_large_image",
    title: "BalanceU — Équilibre ta vie étudiante",
    description: "Plus qu'un agenda : un coach d'équilibre pour tes 7 domaines de vie.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F1E8" },
    { media: "(prefers-color-scheme: dark)", color: "#1A1713" },
  ],
};

// Runs before paint to avoid a theme flash: cookie → localStorage → system.
const themeScript = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);var t=m?m[1]:(localStorage.getItem('theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'));document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";

  return (
    <html
      lang="fr"
      data-theme={theme}
      className={`${fraunces.variable} ${inter.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
