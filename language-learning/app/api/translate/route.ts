import { NextRequest, NextResponse } from "next/server";

const LANGUAGE_NAME_TO_GOOGLE_CODE: Record<string, string> = {
  english: "en",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  chinese: "zh-CN",
  "mandarin chinese": "zh-CN",
  "simplified chinese": "zh-CN",
  "traditional chinese": "zh-TW",
  japanese: "ja",
  korean: "ko",
  hindi: "hi",
  arabic: "ar",
  turkish: "tr",
  dutch: "nl",
  swedish: "sv",
  norwegian: "no",
  danish: "da",
  finnish: "fi",
};

function languageNameToCode(name: string | null | undefined): string {
  if (!name) return "en";
  const key = name.trim().toLowerCase();
  return LANGUAGE_NAME_TO_GOOGLE_CODE[key] ?? "en";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const text = body?.text;
    const targetLanguageName = body?.targetLanguageName as string | null | undefined;

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Missing or empty text" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GOOGLE_TRANSLATE_API_KEY is not set on the server" },
        { status: 500 }
      );
    }

    const target = languageNameToCode(targetLanguageName);

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    const googleRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        target,
        format: "text",
      }),
    });

    if (!googleRes.ok) {
      const errText = await googleRes.text().catch(() => "");
      console.error("Google Translate error:", errText || googleRes.statusText);
      return NextResponse.json({ error: "Translation failed" }, { status: 502 });
    }

    const data = await googleRes.json();
    const translatedText: string = data?.data?.translations?.[0]?.translatedText ?? "";

    return NextResponse.json({ translatedText, targetLanguageCode: target });
  } catch (err) {
    console.error("Unexpected error in /api/translate:", err);
    return NextResponse.json(
      { error: "Server error while translating" },
      { status: 500 }
    );
  }
}

