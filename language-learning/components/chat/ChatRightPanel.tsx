// The right-side panel showing the chat with a partner.
// Made for Chat.tsx

import ChatHeader from "./ChatHeader";
import Messages from "./Messages";
import MessageComposer from "./MessageComposer";

type Message = {
  id: string;
  sender: "me" | "partner";
  text: string;
  sentAt: string; // ISO string
};

type ChatLayoutProps = {
  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;
  language: string;
  messages: Message[];
};

export default function ChatLayout({
  partnerId,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  language,
  messages,
}: ChatLayoutProps) {
  return (
    <div className="flex h-[calc(100dvh)] flex-col overflow-hidden bg-white min-w-0">
      <ChatHeader
        partnerId={partnerId}
        partnerFirstName={partnerFirstName}
        partnerLastName={partnerLastName}
        partnerAvatarUrl={partnerAvatarUrl ?? "/default-avatar.jpg"}
        language={language}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <Messages
            messages={messages}
            partnerFirstName={partnerFirstName}
            partnerLastName={partnerLastName}
            partnerAvatarUrl={partnerAvatarUrl ?? "/default-avatar.jpg"}
        />
      </div>

      <div className="border-t px-4 py-3">
        <MessageComposer />
      </div>
    </div>
  );
}
