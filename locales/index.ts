import { en } from "./en";
import { es } from "./es";

export type Locale = "en" | "es";
export type { Dictionary } from "./en";

const dictionaries = { en, es };

export function getDictionary(locale: string) {
  return dictionaries[locale as Locale] ?? dictionaries.es;
}
