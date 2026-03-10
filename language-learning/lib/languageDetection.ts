import { detectAll } from "tinyld/light";

type TinyLdResult = {
  lang: string;
  accuracy: number;
};

export type LangDetectResult =
  | { tag: string; kind: "detected" }
  | { tag: string; kind: "too_short" }
  | { tag: string; kind: "undetermined" };

type DetectLangTagOptions = {
  hintLanguageNames?: string[];
  fallbackTag?: string;
  minimumTextLength?: number;
};

// Maps lowercase display language names (as stored in the DB) to ISO 639-1 codes.
export const LANG_NAME_TO_ISO639: Record<string, string> = {
  english: "en", spanish: "es", french: "fr", german: "de", portuguese: "pt",
  italian: "it", dutch: "nl", polish: "pl", swedish: "sv", norwegian: "no",
  danish: "da", finnish: "fi", turkish: "tr", romanian: "ro", czech: "cs",
  slovak: "sk", hungarian: "hu", japanese: "ja", chinese: "zh", korean: "ko",
  arabic: "ar", russian: "ru", hindi: "hi", bengali: "bn", vietnamese: "vi",
  thai: "th", catalan: "ca", hebrew: "he", greek: "el", ukrainian: "uk",
  croatian: "hr", serbian: "sr", bulgarian: "bg", latvian: "lv", lithuanian: "lt",
  estonian: "et", slovenian: "sl", malay: "ms", indonesian: "id", tagalog: "tl",
  swahili: "sw", persian: "fa", farsi: "fa", urdu: "ur", mandarin: "zh",
  "mandarin chinese": "zh", "portuguese (brazil)": "pt", "portuguese (portugal)": "pt",
};

// Maps ISO 639-1 codes to BCP-47 language tags.
export const ISO639_TO_BCP47: Record<string, string> = {
  en: "en-US", es: "es-ES", fr: "fr-FR", de: "de-DE", pt: "pt-PT",
  it: "it-IT", nl: "nl-NL", pl: "pl-PL", sv: "sv-SE", no: "nb-NO",
  da: "da-DK", fi: "fi-FI", tr: "tr-TR", ro: "ro-RO", cs: "cs-CZ",
  sk: "sk-SK", hu: "hu-HU", ja: "ja-JP", zh: "zh-CN", ko: "ko-KR",
  ar: "ar-SA", ru: "ru-RU", hi: "hi-IN", bn: "bn-BD", vi: "vi-VN",
  th: "th-TH", ca: "ca-ES", he: "he-IL", el: "el-GR", uk: "uk-UA",
  hr: "hr-HR", sr: "sr-RS", bg: "bg-BG", lv: "lv-LV", lt: "lt-LT",
  et: "et-EE", sl: "sl-SI", ms: "ms-MY", id: "id-ID", tl: "tl-PH",
  sw: "sw-KE", fa: "fa-IR", ur: "ur-PK",
};

function hintIsoCodes(names: string[]): string[] {
  return names
    .map((name) => LANG_NAME_TO_ISO639[name.toLowerCase().trim()])
    .filter((code): code is string => !!code);
}

export function detectLangTag(
  text: string,
  options: DetectLangTagOptions = {}
): LangDetectResult {
  const {
    hintLanguageNames = [],
    fallbackTag = "en-US",
    minimumTextLength = 10,
  } = options;

  // Fast Unicode checks for scripts with distinct character ranges.
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return { tag: "ja-JP", kind: "detected" };
  if (/[\uAC00-\uD7A3]/.test(text)) return { tag: "ko-KR", kind: "detected" };
  if (/[\u4E00-\u9FFF]/.test(text)) return { tag: "zh-CN", kind: "detected" };
  if (/[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text)) return { tag: "ar-SA", kind: "detected" };
  if (/[\u0400-\u04FF]/.test(text)) return { tag: "ru-RU", kind: "detected" };
  if (/[\u0900-\u097F]/.test(text)) return { tag: "hi-IN", kind: "detected" };

  const trimmed = text.trim();
  if (trimmed.length < minimumTextLength) {
    return { tag: fallbackTag, kind: "too_short" };
  }

  const results = detectAll(trimmed) as TinyLdResult[];
  if (results.length === 0) {
    return { tag: fallbackTag, kind: "undetermined" };
  }

  const top = results[0];
  const hints = new Set(hintIsoCodes(hintLanguageNames));

  if (hints.size > 0) {
    const hintMatch = results.find((result) => hints.has(result.lang));
    if (hintMatch && hintMatch.accuracy >= top.accuracy * 0.5) {
      const tag = ISO639_TO_BCP47[hintMatch.lang];
      if (tag) return { tag, kind: "detected" };
    }
  }

  const tag = ISO639_TO_BCP47[top.lang];
  if (tag) return { tag, kind: "detected" };

  return { tag: fallbackTag, kind: "undetermined" };
}