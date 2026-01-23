// The right-side panel showing the chat with a partner.
// Made for pages/chat/...

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
  partnerAvatarUrl: string;
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
  const sorted = [...messages].sort((a, b) => a.sentAt.localeCompare(b.sentAt));

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
      <ChatHeader
        partnerId={partnerId}
        partnerFirstName={partnerFirstName}
        partnerLastName={partnerLastName}
        partnerAvatarUrl={partnerAvatarUrl}
        language={language}
      />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <Messages
            messages={messages}
            partnerFirstName={partnerFirstName}
            partnerLastName={partnerLastName}
            partnerAvatarUrl={partnerAvatarUrl}
        />
      </div>

      <div className="border-t px-4 py-3">
        <MessageComposer />
      </div>
    </div>
  );
}
