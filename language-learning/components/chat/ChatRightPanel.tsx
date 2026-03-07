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
  targetLanguages: string[];
  messages: Message[];
  conversationId: string;
  onSendMessage: (conversationId: string, text: string) => Promise<void>;
  myNativeLanguage: string | null;
};

export default function ChatRightPanel({
  partnerId,
  partnerFirstName,
  partnerLastName,
  partnerAvatarUrl,
  targetLanguages,
  messages,
  conversationId,
  onSendMessage,
  myNativeLanguage,
}: ChatLayoutProps) {
  return (
    <div className="h-[calc(100dvh-72px)] flex flex-col overflow-hidden">
      <div className="shrink-0">
        <ChatHeader
          partnerId={partnerId}
          partnerFirstName={partnerFirstName}
          partnerLastName={partnerLastName}
          partnerAvatarUrl={partnerAvatarUrl}
          targetLanguages={targetLanguages}
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <Messages
            messages={messages}
            partnerFirstName={partnerFirstName}
            partnerLastName={partnerLastName}
            partnerAvatarUrl={partnerAvatarUrl}
            myNativeLanguage={myNativeLanguage}
        />
      </div>

      <div className="shrink-0 border-t border-gray-border-soft px-4 py-3">
        <MessageComposer onSend={(text) => onSendMessage(conversationId, text)} />
      </div>
    </div>
  );
}
