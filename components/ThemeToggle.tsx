"use client";

import { useSyncExternalStore } from "react";
import { Icon } from "@/components/Icon";

type Theme = "light" | "dark";

function subscribe(callback: () => void) {
  const obs = new MutationObserver(callback);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}
function getSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
function getServerSnapshot(): Theme {
  return "light";
}

export function ThemeToggle({ className }: { className?: string }) {
  // Reads the live <html data-theme> attribute; re-renders when it changes
  // (set by the no-flash script or by toggle below). No effect, no mismatch.
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next); // notifies subscribe()
    document.cookie = `theme=${next};path=/;max-age=31536000;samesite=lax`;
    try {
      localStorage.setItem("theme", next);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
      className={
        className ??
        "grid size-[42px] place-items-center rounded-full bg-surface text-ink-soft shadow-[0_0_0_1px_var(--line)] transition hover:bg-surface-2 hover:text-ink active:scale-90"
      }
    >
      <Icon name={theme === "dark" ? "sun" : "moon"} className="size-[18px]" />
    </button>
  );
}
