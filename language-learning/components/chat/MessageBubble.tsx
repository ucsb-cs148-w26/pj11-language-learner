// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx, which is for ChatRightPanel.tsx.

"use client";

type MessageBubbleProps = {
  text: string;
  isMe: boolean;
  time?: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  isSpeaking: boolean;
  onSpeak: () => void;
};

function SpeakerIcon({ isSpeaking }: { isSpeaking: boolean }) {
  return (
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
  );
}

export default function MessageBubble({
  text,
  isMe,
  time,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  isSpeaking,
  onSpeak,
}: MessageBubbleProps) {
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
            "flex items-center gap-2",
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
            onClick={onSpeak}
            aria-label={isSpeaking ? "Stop reading message" : "Read message aloud"}
            title={isSpeaking ? "Stop" : "Read aloud"}
            className={[
              "mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full transition",
              isSpeaking
                ? "bg-blue-dark text-white"
                : "bg-gray-soft-2 text-gray-muted hover:bg-gray-200",
            ].join(" ")}
          >
            <SpeakerIcon isSpeaking={isSpeaking} />
          </button>
        </div>

        {time ? (
          <div className="mt-1 w-fit text-xs text-gray-muted-2">{time}</div>
        ) : null}
      </div>
    </div>
  );
}