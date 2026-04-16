import i18next from "i18next";
import en from "./locales/en.js";
import ja from "./locales/ja.js";

let initialized = false;

export async function initI18n(locale?: string): Promise<typeof i18next> {
  if (initialized) {
    if (locale && i18next.language !== locale) {
      await i18next.changeLanguage(locale);
    }
    return i18next;
  }

  const detectedLocale = locale ?? detectLocale();

  await i18next.init({
    lng: detectedLocale,
    fallbackLng: "en",
    defaultNS: "translation",
    resources: {
      en: { translation: en },
      ja: { translation: ja },
    },
    interpolation: {
      escapeValue: false,
    },
  });

  initialized = true;
  return i18next;
}

function detectLocale(): string {
  // Check LANG environment variable (works in both Node.js and test environments)
  if (typeof globalThis !== "undefined" && "process" in globalThis) {
    const env = (globalThis as Record<string, unknown>).process as { env?: Record<string, string> };
    const lang = env?.env?.LANG ?? env?.env?.LC_ALL ?? "";
    if (lang.startsWith("ja")) return "ja";
  }
  return "en";
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18next.t(key, options);
}
