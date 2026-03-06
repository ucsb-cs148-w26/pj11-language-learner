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

import { useEffect, useMemo, useState } from "react";
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
  createdAt: string;

  partnerId: string;
  partnerFirstName: string;
  partnerLastName: string;
  partnerAvatarUrl: string | null;

  targetLanguages: string[];

  lastMessageText: string;
  lastMessageAt: string | null;
  unreadCount: number;

  messages: Message[];
};

type ChatProps = {
  conversations: Conversation[];
  selectedConversationId: string | null;
  onSelectConversationId?: (conversationId: string) => void;
  onSendMessage?: (conversationId: string, text: string) => Promise<void>;
};

export default function Chat({ conversations, selectedConversationId, onSelectConversationId, onSendMessage }: ChatProps) {
  function handleSelectConversation(id: string) {
    onSelectConversationId?.(id);
  }

  const selected = useMemo(
    () => selectedConversationId ? conversations.find((c) => c.conversationId === selectedConversationId) ?? null : null,
    [conversations, selectedConversationId]
  );

  return (
    <div className="h-full w-full min-h-0 overflow-hidden bg-white">
      <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[320px_1fr]">
        {/* Left sidebar */}
        <div className="hidden h-full min-h-0 md:block">
          <ChatLeftPanel
            chats={conversations.map((c) => ({
              conversationId: c.conversationId,
              createdAt: c.createdAt,
              partnerId: c.partnerId,
              partnerFirstName: c.partnerFirstName,
              partnerLastName: c.partnerLastName,
              partnerAvatarUrl: c.partnerAvatarUrl,
              lastMessageText: c.lastMessageText,
              lastMessageAt: c.lastMessageAt,
              unreadCount: c.unreadCount,
            }))}
            //selectedConversationId={selectedConversationId}
            onSelectConversation={handleSelectConversation}
          />
        </div>

        {/* Right panel */}
        <div className="min-w-0 h-full min-h-0 overflow-hidden">
          {selected ? (
            <ChatRightPanel
              partnerId={selected.partnerId}
              partnerFirstName={selected.partnerFirstName}
              partnerLastName={selected.partnerLastName}
              partnerAvatarUrl={selected.partnerAvatarUrl}
              targetLanguages={selected.targetLanguages}
              messages={selected.messages}
              conversationId={selected.conversationId}
              onSendMessage={async (conversationId, text) => {
                await onSendMessage?.(conversationId, text); }}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border bg-white px-6 text-gray-muted shadow-sm">
                <div className="max-w-md text-center">
                    <div className="text-lg font-semibold text-gray-text">No conversations yet</div>
                    <p className="mt-2 text-sm text-gray-muted">
                    Start one by heading to the{" "}
                    <Link href="/discover" className="font-medium text-blue hover:underline">
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
