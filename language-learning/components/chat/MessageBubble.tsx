// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx, which is for ChatRightPanel.tsx.

import { useState } from "react";

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
};

export default function MessageBubble({
  messageId,
  text,
  isMe,
  time,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
}: MessageBubbleProps) {
  const [phonetic, setPhonetic] = useState<PhoneticResponse | null>(null);
  const [phoneticOpen, setPhoneticOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function labelForType(type: PhoneticResponse["type"]) {
    switch (type) {
      case "cmn":
        return "Mandarin";
      case "jpn":
        return "Japanese";
      case "eng":
        return "English";
      default:
        return "Unknown";
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
            <img
            src={partnerAvatarUrl ?? "/default-avatar.jpg"}
            alt={`${partnerFirstName} ${partnerLastName} avatar`}
            className="h-8 w-8 rounded-full object-cover"
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
          className={[
            "flex w-fit max-w-full items-start gap-2",
            isMe ? "flex-row-reverse" : "flex-row",
          ].join(" ")}
        >
          <div
            className={[
              "inline-flex w-fit max-w-full rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
              isMe ? "bg-blue-dark text-white" : "bg-gray-soft-2 text-gray-text",
            ].join(" ")}
          >
            <span className="whitespace-pre-wrap break-all">{text}</span>
          </div>

          <button
            type="button"
            onClick={handleTogglePhonetic}
            disabled={isLoading}
            className={[
              "mt-1 h-fit rounded-full border px-3 py-1 text-xs font-medium transition",
              "border-gray-border-soft text-gray-muted-2 hover:text-gray-text",
              "disabled:cursor-not-allowed disabled:opacity-60",
            ].join(" ")}
          >
            {isLoading
              ? "Loading phonetic..."
              : phoneticOpen
                ? "Hide"
                : "Phonetic"}
          </button>
        </div>

        {time ? (
          <div className="mt-1 w-fit text-xs text-gray-muted-2">{time}</div>
        ) : null}

        {error ? (
          <div className="mt-1 text-xs text-red-600">{error}</div>
        ) : null}

        {phoneticOpen && phonetic ? (
          <div className="mt-2 rounded-xl border border-gray-border-soft bg-off-white px-3 py-2 text-xs text-gray-text">
            <div className="font-medium text-gray-muted-2">
              {labelForType(phonetic.type)} phonetic
            </div>
            <div className="mt-1 break-words">{phonetic.pronunciation}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}