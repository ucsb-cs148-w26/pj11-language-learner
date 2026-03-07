// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx, which is for ChatRightPanel.tsx.

"use client";

import { useState } from "react";
import Avatar from "@/components/Avatar";

type PhoneticResponse = {
  messageId: string;
  text: string;
  type: "cmn" | "jpn" | "eng" | "und";
  pronunciation: string;
};

type MessageBubbleProps = {
  messageId: string;
  text: string;
  isMe: boolean;
  time?: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  myNativeLanguage: string | null;
  isSpeaking: boolean;
  hasSpeakError: boolean;
  onSpeak: () => void;
};

export default function MessageBubble({
  messageId,
  text,
  isMe,
  time,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  myNativeLanguage,
  isSpeaking,
  hasSpeakError,
  onSpeak,
}: MessageBubbleProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [translated, setTranslated] = useState<string | null>(null);
  const [translationOpen, setTranslationOpen] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  const [phonetic, setPhonetic] = useState<PhoneticResponse | null>(null);
  const [phoneticOpen, setPhoneticOpen] = useState(false);

  // translation
  async function handleTranslateClick() {
    if (isTranslating) return;

    if (translated) {
      setTranslationOpen((prev) => !prev);
      return;
    }

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
      setTranslationOpen(true);
    } catch (e: any) {
      setError(e?.message ?? "Translation failed");
    } finally {
      setIsTranslating(false);
    }
  }

  // phonetics
  function labelForType(type: PhoneticResponse["type"]) {
    switch (type) {
      case "cmn":
        return "Mandarin";
      case "jpn":
        return "Japanese";
      case "eng":
        return "English";
      default:
        return "Unsupported";
    }
  }

  async function handleTogglePhonetic() {
    if (phonetic) {
      setPhoneticOpen((prev) => !prev);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/phonetic/${messageId}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        const reason = payload?.error || "request_failed";
        throw new Error(reason);
      }

      const data = (await res.json()) as PhoneticResponse;
      setPhonetic(data);
      setPhoneticOpen(true);
    } catch (err) {
      setError("Failed to load phonetic info.");
    } finally {
      setIsLoading(false);
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
                disabled={isTranslating}
                aria-label={
                  isTranslating
                    ? `Translating to ${myNativeLanguage}`
                    : translated && translationOpen
                      ? `Hide translation`
                      : translated
                        ? `Show translation`
                        : `Translate to ${myNativeLanguage}`
                }
                title={
                  isTranslating
                    ? `Translating to ${myNativeLanguage}`
                    : translated && translationOpen
                      ? `Hide translation`
                      : translated
                        ? `Show translation`
                        : `Translate to ${myNativeLanguage}`
                }
                className={[
                  "mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full transition disabled:opacity-60",
                  translated && translationOpen
                    ? "bg-blue-dark text-white"
                    : "bg-gray-soft-2 text-gray-muted hover:bg-gray-200",
                ].join(" ")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M5 8l6 6" />
                  <path d="M4 14l6-6 2-3" />
                  <path d="M2 5h12" />
                  <path d="M7 2h1" />
                  <path d="M22 22l-5-10-5 10" />
                  <path d="M14 18h6" />
                </svg>
              </button>
          )}
          <button
              type="button"
              onClick={handleTogglePhonetic}
              disabled={isLoading}
              aria-label={
                isLoading
                  ? "Loading phonetic"
                  : phoneticOpen
                    ? "Hide phonetic"
                    : "Show phonetic"
              }
              title={
                isLoading
                  ? "Loading phonetic"
                  : phoneticOpen
                    ? "Hide phonetic"
                    : "Show phonetic"
              }
              className={[
                "mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full transition disabled:opacity-60",
                phoneticOpen
                  ? "bg-blue-dark text-white"
                  : "bg-gray-soft-2 text-gray-muted hover:bg-gray-200",
              ].join(" ")}
            >
              {isLoading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 12c2.5-3 5.2-4.5 8-4.5s5.5 1.5 8 4.5c-2.5 3-5.2 4.5-8 4.5S6.5 15 4 12Z" />
                  <path d="M8 12c1.2 1 2.6 1.5 4 1.5s2.8-.5 4-1.5" />
                </svg>
              )}
            </button>
            <button
            type="button"
            onClick={onSpeak}
            aria-label={isSpeaking ? "Stop reading message" : "Read message aloud"}
            title={isSpeaking ? "Stop" : "Read aloud"}
            className={[
              "mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full transition",
              isSpeaking
                ? "bg-blue-dark text-white"
                : "bg-gray-soft-2 text-gray-muted hover:bg-gray-200",
            ].join(" ")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-4 w-4 ${isSpeaking ? "opacity-100" : "opacity-80"}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
        </div>

        {translated && translationOpen && (
          <div className="mt-1 w-fit text-xs italic text-gray-muted">
            <span className="font-medium not-italic">Translated</span>
            {myNativeLanguage ? ` (${myNativeLanguage})` : null}
            {": "}
            {translated}
          </div>
        )}

        {phoneticOpen && phonetic ? (
          phonetic.type === "und" ? (
            <div className="mt-1 w-fit text-xs text-gray-muted">
              Language not supported for phonetics
            </div>
          ) : (
            <div className="mt-1 w-fit text-xs italic text-gray-muted">
              <span className="font-medium not-italic">Phonetic </span>
              ({labelForType(phonetic.type)})
              {`: `}
              {phonetic.pronunciation}
            </div>
          )
        ) : null}

        {hasSpeakError && (
          <div className="mt-1 w-fit text-xs text-gray-muted">
            No voice available for this language
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

