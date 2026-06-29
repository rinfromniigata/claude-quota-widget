import { derived, writable } from "svelte/store";
import { en } from "./locales/en";
import { ja } from "./locales/ja";

export type Lang = "ja" | "en";
export type LangSetting = "auto" | Lang;

const dicts: Record<Lang, Record<string, string>> = { en, ja };

// Resolve the OS / browser locale down to a supported language.
function detectLang(): Lang {
  const n = (navigator.language || "en").toLowerCase();
  return n.startsWith("ja") ? "ja" : "en";
}

// User preference: "auto" follows the system, otherwise a fixed language.
export const langSetting = writable<LangSetting>("auto");

// Effective language actually used for rendering.
export const locale = derived(langSetting, ($s): Lang =>
  $s === "auto" ? detectLang() : $s,
);

// Reactive translator. Use as `$t("key", { param })` inside components.
export const t = derived(locale, ($locale) => {
  const dict = dicts[$locale];
  return (key: string, params?: Record<string, string | number>): string => {
    let str = dict[key] ?? en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
});
