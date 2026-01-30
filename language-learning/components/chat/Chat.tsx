// Encompasses the full chat interface that uses the components in this folder.
// Components heirarchy:
// - Chat (this file)
//   - ChatLeftPanel
//   - ChatRightPanel
//     - ChatHeader
//     - Messages
//        - MessageBubble
//     - MessageComposer


"use client";

import { useMemo, useState } from "react";
import ChatLeftPanel from "./ChatLeftPanel";
import ChatRightPanel from "./ChatRightPanel";
import Link from 'next/link'

type Message = {
  id: string;
  sender: "me" | "partner";
  text: string;
  sentAt: string;
};

export type Conversation = {
  conversationId: string;

  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;

  language: string;

  lastMessageText: string;
  lastMessageAt: string;
  unreadCount: number;

  messages: Message[];
};

type ChatProps = {
  conversations: Conversation[];
  initialConversationId?: string;
};

export default function Chat({ conversations, initialConversationId }: ChatProps) {
  const defaultId = initialConversationId ?? conversations[0]?.conversationId ?? "";
  const [selectedConversationId, setSelectedConversationId] = useState(defaultId);

  const selected = useMemo(
    () => conversations.find((c) => c.conversationId === selectedConversationId) ?? conversations[0],
    [conversations, selectedConversationId]
  );

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <div className="grid h-full grid-cols-1 md:grid-cols-[320px_1fr]">
        {/* Left sidebar */}
        <div className="hidden h-full md:block">
          <ChatLeftPanel
            chats={conversations.map((c) => ({
              conversationId: c.conversationId,
              partnerId: c.partnerId,
              partnerFirstName: c.partnerFirstName,
              partnerLastName: c.partnerLastName,
              partnerAvatarUrl: c.partnerAvatarUrl,
              lastMessageText: c.lastMessageText,
              lastMessageAt: c.lastMessageAt,
              unreadCount: c.unreadCount,
            }))}
            selectedConversationId={selectedConversationId}
            onSelectConversation={setSelectedConversationId}
          />
        </div>

        {/* Right panel */}
        <div className="min-w-0 h-full">
          {selected ? (
            <ChatRightPanel
              partnerId={selected.partnerId}
              partnerFirstName={selected.partnerFirstName}
              partnerLastName={selected.partnerLastName}
              partnerAvatarUrl={selected.partnerAvatarUrl}
              language={selected.language}
              messages={selected.messages}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border bg-white px-6 text-zinc-600 shadow-sm">
                <div className="max-w-md text-center">
                    <div className="text-lg font-semibold text-zinc-900">No conversations yet</div>
                    <p className="mt-2 text-sm text-zinc-600">
                    Start one by heading to the{" "}
                    <Link href="/discover" className="font-medium text-blue-800 hover:underline">
                        Discover
                    </Link>{" "}
                    page.
                    </p>
                </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
