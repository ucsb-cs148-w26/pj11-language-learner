// Sidebar showing list of chat conversations with partners.
// Made for Chat.tsx

"use client";

type ChatListItem = {
  conversationId: string;

  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;

  lastMessageText: string;
  lastMessageAt: string; // ISO string
  unreadCount: number;
};

type ChatLeftPanelProps = {
  chats: ChatListItem[];
  selectedConversationId: string;
  onSelectConversation?: (conversationId: string) => void;
};

function formatRelative(iso: string) {
  const d = new Date(iso);
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60_000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return `${days}d`;
}

export default function ChatLeftPanel({
  chats,
  selectedConversationId,
  onSelectConversation,
}: ChatLeftPanelProps) {
  const sorted = [...chats].sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));

  return (
    <aside className="flex h-[calc(100dvh)] min-h-0 flex-col overflow-hidden border-r bg-white">
      {/* Header */}
      <div className="border-b px-4 py-3">
        <div className="text-lg font-semibold text-zinc-900">Conversations</div>
      </div>

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sorted.map((c) => {
          const isSelected = c.conversationId === selectedConversationId;
          const avatarSrc = c.partnerAvatarUrl ?? "/default-avatar.jpg";

          return (
            <button
              key={c.conversationId}
              type="button"
              onClick={() => onSelectConversation?.(c.conversationId)}
              className={[
                "w-full border-b px-4 py-3 text-left transition",
                isSelected ? "bg-zinc-100" : "hover:bg-zinc-50",
              ].join(" ")}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <img
                  src={avatarSrc}
                  alt={`${c.partnerFirstName} ${c.partnerLastName}`}
                  className="h-10 w-10 rounded-full object-cover"
                />

                {/* Main text */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate font-medium text-zinc-900">
                      {c.partnerFirstName} {c.partnerLastName}
                    </div>
                    <div className="shrink-0 text-xs text-zinc-400">
                      {formatRelative(c.lastMessageAt)}
                    </div>
                  </div>

                  <div className="mt-0.5 flex items-center justify-between gap-3">
                    <div className="truncate text-sm text-zinc-500">
                      {c.lastMessageText}
                    </div>

                    {c.unreadCount > 0 ? (
                      <div className="shrink-0 rounded-full bg-blue-950 px-2 py-0.5 text-xs font-medium text-white">
                        {c.unreadCount}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
