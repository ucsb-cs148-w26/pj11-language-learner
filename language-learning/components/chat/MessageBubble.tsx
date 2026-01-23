// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx.

type MessageBubbleProps = {
  text: string;
  isMe: boolean;
  time?: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string;
};

export default function MessageBubble({
  text,
  isMe,
  time,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
}: MessageBubbleProps) {
  return (
    <div className={["flex", isMe ? "justify-end" : "justify-start"].join(" ")}>
      {/* Left side: avatar for partner messages */}
      {!isMe ? (
        <div className="mr-2 flex w-9 items-start">
            <img
            src={partnerAvatarUrl}
            alt={`${partnerFirstName} ${partnerLastName} avatar`}
            className="h-8 w-8 rounded-full object-cover"
            />
        </div>
      ) : null}

      <div className="max-w-[75%] md:max-w-[70%]">
        <div
          className={[
            "rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
            isMe ? "bg-blue-950 text-white" : "bg-zinc-100 text-zinc-900",
          ].join(" ")}
        >
          <div className="whitespace-pre-wrap break-words">{text}</div>
        </div>

        {time ? (
          <div
            className={[
              "mt-1 text-xs text-zinc-400",
              isMe ? "text-right" : "text-left",
            ].join(" ")}
          >
            {time}
          </div>
        ) : null}
      </div>
    </div>
  );
}