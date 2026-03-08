import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = body?.text;
  const nativeLanguage = body?.nativeLanguage;

  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY is not set on the server" }, { status: 500 });
  }

  const replyLang = nativeLanguage || "English";
  const prompt = `You are a friendly language tutor.
    Review the user's message for mistakes.

    Rules:
    - Respond entirely in ${replyLang}.
    - Do not greet the user.
    - Do not introduce your answer.
    - Do not lead with things like "You made...", "There are...", "This sentence has...", or "I found...".
    - Start immediately with an explanation of the mistake, and so on for all mistakes.
    - If the message is correct, say only: "Nice work!"
    - Be brief.

    Message: "${text.replace(/"/g, '\\"')}"`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`;

  let geminiRes: Response;
  try {
    geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 300,
          thinkingConfig: {
            thinkingLevel: "minimal",
          },
        },
      }),
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Gemini API" }, { status: 502 });
  }

  if (!geminiRes.ok) {
    const errText = await geminiRes.text().catch(() => "");
    console.error("Gemini error:", errText || geminiRes.statusText);

    if (geminiRes.status === 429) {
      return NextResponse.json(
        {
          error: "AI feedback is temporarily unavailable. Please try again later.",
        },
        { status: 429 }
      );
    }

    return NextResponse.json({ error: "Gemini request failed" }, { status: 502 });
  }

  const data = await geminiRes.json();
  const feedback: string = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  console.log("Gemini feedback:", feedback);
  if (!feedback) {
    return NextResponse.json({ error: "No feedback returned" }, { status: 502 });
  }

  return NextResponse.json({ feedback });
}
