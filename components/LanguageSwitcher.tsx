"use client";

import { useTransition } from "react";
import { setLocale } from "@/lib/locale.actions";
import type { Locale } from "@/locales";

export default function LanguageSwitcher({ current }: { current: Locale }) {
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next: Locale = current === "es" ? "en" : "es";
    startTransition(() => setLocale(next));
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-green-200 hover:bg-green-800 hover:text-white transition-colors disabled:opacity-50"
    >
      <span className="text-base leading-none">{current === "es" ? "🇺🇸" : "🇪🇸"}</span>
      <span>{current === "es" ? "English" : "Español"}</span>
    </button>
  );
}
