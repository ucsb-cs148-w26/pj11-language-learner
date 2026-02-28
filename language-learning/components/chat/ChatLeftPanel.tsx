// Sidebar showing list of chat conversations with partners.
// Made for Chat.tsx

import Link from "next/link";

type ChatListItem = {
  conversationId: string;
  createdAt: string;

  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;

  lastMessageText: string;
  lastMessageAt: string | null; // ISO string
  unreadCount: number;
};

type ChatLeftPanelProps = {
  chats: ChatListItem[];
  selectedConversationId?: string;
  onSelectConversation?: (conversationId: string) => void;
  linkMode?: boolean;
  showHeader?: boolean;
  containerClassName?: string;
  outerBorder?: boolean;
};

function formatRelative(iso: string | null) {
  if (!iso) return "";
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
  linkMode,
  showHeader = true,
  containerClassName = "",
  outerBorder = true,
}: ChatLeftPanelProps) {
  const sorted = [...chats].sort((a, b) => {
    const ta = new Date(a.lastMessageAt ?? a.createdAt).getTime(); 
    const tb = new Date(b.lastMessageAt ?? b.createdAt).getTime();

    return tb - ta;
  });

  return (
    <aside 
      className={[
        "h-full min-h-0 bg-white overflow-hidden",
        outerBorder? "border-x border-b border-gray-border-soft" : "border-0",
        containerClassName,
      ].join(" ")}
    >
      {/* Header */}
      {showHeader && (
      <div className="border-b border-gray-border-soft px-4 py-3">
        <div className="text-lg font-semibold text-gray-text">Conversations</div>
      </div>
      )}

      {/* List */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {sorted.map((c) => {
          const isSelected = c.conversationId === selectedConversationId;
          const avatarSrc = c.partnerAvatarUrl ?? "/default-avatar.jpg";

          const className = [
            "w-full block h-17 border-b border-gray-border-soft last:border-0 px-4 py-3 text-left transition",
            isSelected ? "bg-gray-soft-2" : "hover:bg-off-white",
          ].join(" ");

          const content = (
            <div className="flex items-center gap-3">
              <img
                src={avatarSrc}
                alt={`${c.partnerFirstName} ${c.partnerLastName}`}
                className="h-10 w-10 rounded-full object-cover"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-3">
                  <div className="truncate text-base font-medium text-gray-text">
                    {c.partnerFirstName} {c.partnerLastName}
                  </div>
                  <div className="shrink-0 text-xs text-gray-muted-2">
                    {c.lastMessageAt ? formatRelative(c.lastMessageAt) : "New"}
                  </div>
                </div>

                <div className="mt-0.5 flex items-center justify-between gap-3">
                  <div className="truncate text-sm text-gray-muted-2">
                    {c.lastMessageText || "No messages yet"}
                  </div>

                  {c.unreadCount > 0 ? (
                    <div className="shrink-0 rounded-full bg-blue-dark px-2 py-0.5 text-xs font-medium text-white">
                      {c.unreadCount}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          );

          return linkMode ? (
            <Link
              key={c.conversationId}
              href={`/chats?c=${encodeURIComponent(c.conversationId)}`}
              className={className}
            >
              {content}
            </Link>
          ) : (
            <button
              key={c.conversationId}
              type="button"
              onClick={() => onSelectConversation?.(c.conversationId)}
              className={className}
            >
              {content}
            </button>
          );
        })}
      </div>
    </aside>
  );
}
