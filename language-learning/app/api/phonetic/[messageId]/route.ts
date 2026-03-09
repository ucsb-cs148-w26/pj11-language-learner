import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { franc } from "franc";
import Kuroshiro from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";
import { pinyin } from "pinyin-pro";
import { dictionary } from "cmu-pronouncing-dictionary";
import { transliterate } from "transliteration";

export const runtime = "nodejs";

/* ---------------- Types ---------------- */

type LangType = "cmn" | "jpn" | "eng" | "spa" | "kor" | "rus" | "und";

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type PhoneticResponse = {
  messageId: string;
  text: string;
  type: LangType;
  pronunciation: string;
};

/* ---------------- Utils ---------------- */

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

/* ---------------- IPA mapping ---------------- */

const ARPABET_TO_IPA: Record<string, string> = {
  AA: "ɑ",
  AE: "æ",
  AH: "ʌ",
  AO: "ɔ",
  AW: "aʊ",
  AY: "aɪ",
  B: "b",
  CH: "tʃ",
  D: "d",
  DH: "ð",
  EH: "ɛ",
  ER: "ɝ",
  EY: "eɪ",
  F: "f",
  G: "g",
  HH: "h",
  IH: "ɪ",
  IY: "i",
  JH: "dʒ",
  K: "k",
  L: "l",
  M: "m",
  N: "n",
  NG: "ŋ",
  OW: "oʊ",
  OY: "ɔɪ",
  P: "p",
  R: "r",
  S: "s",
  SH: "ʃ",
  T: "t",
  TH: "θ",
  UH: "ʊ",
  UW: "u",
  V: "v",
  W: "w",
  Y: "j",
  Z: "z",
  ZH: "ʒ",
};

function arpabetToIPA(arpabet: string): string {
  return arpabet
    .split(" ")
    .map((p) => {
      const phoneme = p.replace(/[0-9]/g, "");
      return ARPABET_TO_IPA[phoneme] || "";
    })
    .join("");
}

/* ---------------- Script Detection ---------------- */

function hasKana(text: string): boolean {
  return /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
}

function hasHan(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function hasHangul(text: string): boolean {
  return /[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(text);
}

function hasCyrillic(text: string): boolean {
  return /[\u0400-\u04FF]/.test(text);
}

function hasSpanishMarkers(text: string): boolean {
  return /[ñÑáéíóúÁÉÍÓÚüÜ¡¿]/.test(text);
}

function hasRussianMarkers(text: string): boolean {
  return /[ЁёЫыЭэЪъ]/.test(text);
}

/* ---------------- Korean helpers ---------------- */

type HangulDecomposed = {
  initial: number;
  medial: number;
  final: number;
};

function decomposeHangulSyllable(ch: string): HangulDecomposed | null {
  if (!ch) return null;
  const code = ch.charCodeAt(0);

  if (code < 0xac00 || code > 0xd7a3) return null;

  const sIndex = code - 0xac00;
  const initial = Math.floor(sIndex / 588);
  const medial = Math.floor((sIndex % 588) / 28);
  const final = sIndex % 28;

  return { initial, medial, final };
}

/* ---------------- Language Detection ---------------- */

function detectLangType(textRaw: string): LangType {
  const text = normalizeText(textRaw);

  if (!text) return "und";

  if (hasKana(text)) return "jpn";
  if (hasHangul(text)) return "kor";
  if (hasHan(text)) return "cmn";

  // Strong Spanish character-based detection
  if (hasSpanishMarkers(text)) return "spa";

  // Strong Russian character-based detection
  if (hasRussianMarkers(text)) return "rus";

  const code = franc(text, {
    only: ["cmn", "jpn", "eng", "spa", "kor", "rus"],
    minLength: 3,
  });

  if (
    code === "cmn" ||
    code === "jpn" ||
    code === "eng" ||
    code === "spa" ||
    code === "kor" ||
    code === "rus"
  ) {
    return code;
  }

  // Fallback: any Cyrillic text is treated as Russian
  if (hasCyrillic(text)) return "rus";

  if (/^[a-zA-Z\s]+$/.test(text)) return "eng";

  return "und";
}

/* ---------------- Kuroshiro Singleton ---------------- */

let kuroshiroInstance: any = null;
let kuroshiroInitPromise: Promise<void> | null = null;

async function getKuroshiro() {
  if (kuroshiroInstance) return kuroshiroInstance;

  if (!kuroshiroInitPromise) {
    const ks = new Kuroshiro();

    kuroshiroInitPromise = ks
      .init(
        new KuromojiAnalyzer({
          dictPath: "node_modules/kuromoji/dict",
        })
      )
      .then(() => {
        kuroshiroInstance = ks;
      });
  }

  await kuroshiroInitPromise;
  return kuroshiroInstance!;
}

/* ---------------- Pronunciation Engine ---------------- */

async function toPronunciation(
  textRaw: string,
  type: LangType
): Promise<string> {
  const text = normalizeText(textRaw);
  if (!text) return "";

  /* Chinese */
  if (type === "cmn") {
    return pinyin(text, { toneType: "symbol", type: "array" }).join(" ");
  }

  /* Japanese */
  if (type === "jpn") {
    const ks = await getKuroshiro();
    const romaji = await ks.convert(text, { to: "romaji" });
    const kana = await ks.convert(text, { to: "hiragana" });

    return `${romaji} (${kana})`;
  }

  /* Korean */
  if (type === "kor") {
    return transliterate(text);
  }

  /* Russian */
  if (type === "rus") {
    return transliterate(text);
  }

  /* Spanish */
  if (type === "spa") {
    return transliterate(text);
  }

  /* English → IPA */
  if (type === "eng") {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word) => {
        const entry = dictionary[word];
        if (!entry) return word;

        return arpabetToIPA(entry);
      })
      .join(" ");
  }

  /* All other languages */
  return transliterate(text);
}

/* ---------------- DB Loader ---------------- */

async function getMessageTextById(
  supabase: any,
  messageId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, body, created_at")
    .eq("id", messageId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as MessageRow;
  return row.body;
}

/* ---------------- Route ---------------- */

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  const supabase = await createClient();

  const { messageId } = await context.params;

  if (!messageId) {
    return NextResponse.json({ error: "missing_messageId" }, { status: 400 });
  }

  const text = await getMessageTextById(supabase, messageId);

  if (!text) {
    return NextResponse.json({ error: "message_not_found" }, { status: 404 });
  }

  const type = detectLangType(text);
  const pronunciation = await toPronunciation(text, type);

  const response: PhoneticResponse = {
    messageId,
    text,
    type,
    pronunciation,
  };

  return NextResponse.json(response);
}