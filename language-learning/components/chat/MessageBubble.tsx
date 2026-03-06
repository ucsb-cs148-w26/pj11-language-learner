// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx, which is for ChatRightPanel.tsx.

"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";

type MessageBubbleProps = {
  text: string;
  isMe: boolean;
  time?: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  myNativeLanguage: string | null;
};

export default function MessageBubble({
  text,
  isMe,
  time,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  myNativeLanguage,
}: MessageBubbleProps) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleTranslateClick() {
    if (isTranslating || translated) return;
    setIsTranslating(true);
    setError(null);

    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          targetLanguageName: myNativeLanguage,
        }),
      });

      const body = await res.json();
      if (!res.ok || !body || body.error) {
        throw new Error(body?.error || "Translation failed");
      }

      setTranslated(body.translatedText ?? "");
    } catch (e: any) {
      setError(e?.message ?? "Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className={["flex", isMe ? "justify-end" : "justify-start"].join(" ")}>
      {/* Left side: avatar for partner messages */}
      {!isMe ? (
        <div className="mr-2 flex w-9 items-start">
          <Avatar
            src={partnerAvatarUrl}
            alt={`${partnerFirstName} ${partnerLastName} avatar`}
            size="w-8 h-8"
            iconSize="w-4 h-4"
          />
        </div>
      ) : null}

      <div
        className={[
          "flex w-fit max-w-[75%] md:max-w-[70%] flex-col",
          isMe ? "items-end" : "items-start",
        ].join(" ")}
      >
        <div
          className={["flex items-start gap-1", isMe ? "flex-row-reverse" : "flex-row"].join(" ")}
        >
          <div
            className={[
              "inline-flex w-fit max-w-full rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
              isMe ? "bg-blue-dark text-white" : "bg-gray-soft-2 text-gray-text",
            ].join(" ")}
          >
            <span className="whitespace-pre-wrap break-all">{text}</span>
          </div>

          {/* Translate icon/button for partner messages */}
          {!isMe && myNativeLanguage && (
            <button
              type="button"
              onClick={handleTranslateClick}
              disabled={isTranslating || !!translated}
              className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-border-soft bg-white text-[10px] font-medium text-gray-muted-2 hover:text-gray-muted hover:bg-off-white disabled:opacity-60"
              aria-label={`Translate to ${myNativeLanguage}`}
            >
              <span>tr</span>
            </button>
          )}
        </div>

        {translated && (
          <div className="mt-1 w-fit text-xs italic text-gray-muted">
            <span className="font-medium not-italic">Translated</span>
            {myNativeLanguage ? ` (${myNativeLanguage})` : null}
            {": "}
            {translated}
          </div>
        )}

        {error && (
          <div className="mt-1 w-fit text-xs text-dark-red">
            {error}
          </div>
        )}

        {time ? (
          <div className="mt-1 w-fit text-xs text-gray-muted-2">{time}</div>
        ) : null}
      </div>
    </div>
  );
}

