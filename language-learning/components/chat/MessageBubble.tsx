// Displays a chat message bubble, styled differently for messages sent by the user and their partner.
// Includes time and partner avatar for partner messages.
// Made for Messages.tsx, which is for ChatRightPanel.tsx.

type MessageBubbleProps = {
  text: string;
  isMe: boolean;
  time?: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
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
            "inline-flex w-fit max-w-full rounded-2xl px-4 py-2 text-sm leading-relaxed shadow-sm",
            isMe ? "bg-blue-950 text-white" : "bg-zinc-100 text-zinc-900",
          ].join(" ")}
        >
          <span className="whitespace-pre-wrap break-all">{text}</span>
        </div>

        {time ? (
          <div className="mt-1 w-fit text-xs text-zinc-400">{time}</div>
        ) : null}
      </div>
    </div>
  );
}