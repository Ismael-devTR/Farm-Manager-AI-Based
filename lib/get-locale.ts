import { cookies } from "next/headers";
import type { Locale } from "@/locales";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("NEXT_LOCALE")?.value;
  return value === "en" ? "en" : "es";
}
