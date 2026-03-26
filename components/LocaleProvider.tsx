"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "@/locales";

const LocaleContext = createContext<Dictionary | null>(null);

export function LocaleProvider({
  dict,
  children,
}: {
  dict: Dictionary;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={dict}>{children}</LocaleContext.Provider>
  );
}

export function useDict(): Dictionary {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useDict must be used inside LocaleProvider");
  return ctx;
}
