"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Chat, { Conversation } from "@/components/chat/Chat";

type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ChatsClient({ cFromUrl }: { cFromUrl: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const c = searchParams.get("c") ?? cFromUrl;

  // Load conversation list (sidebar)
  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      setLoading(true);

      const res = await fetch("/api/chats");
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to load chats");

      setMyUserId(body?.myUserId ?? null);

      const ui: Conversation[] = (body?.conversations ?? []).map((c: Conversation) => ({
        ...c,
        messages: [],
      }));

      const preferred =
        c && ui.some((x) => x.conversationId === c)
          ? c
          : ui[0]?.conversationId ?? null;

      if (cancelled) return;

      setConversations(ui);
      setSelectedConversationId(preferred);
      setLoading(false);
    }

    loadList().catch((e) => {
      console.error("loadList failed:", e?.message ?? e, e);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!c) return;

    if (conversations.some((x) => x.conversationId === c)) {
      setSelectedConversationId(c);
    }
  }, [c, conversations]);

  // Fetch messages for a given conversation and patch into state
  async function loadMessagesForConversation(conversationId: string, userId: string) {
    const res = await fetch(`/api/chats/${encodeURIComponent(conversationId)}/messages`);
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || "Failed to load messages");

    const data = (body?.messages ?? []) as ApiMessage[];

    const ui = data.map((m) => ({
      id: m.id,
      sender: m.sender_id === userId ? ("me" as const) : ("partner" as const),
      text: m.body,
      sentAt: m.created_at,
    }));

    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? {
              ...c,
              messages: ui,
            }
          : c
      )
    );
  }

  async function handleSendMessage(conversationId: string, text: string) {
    if (!myUserId) return;

    const res = await fetch(`/api/chats/${encodeURIComponent(conversationId)}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body?.error || "Failed to send message");

    setConversations((prev) =>
      prev.map((c) => {
        if (c.conversationId !== conversationId) return c;

        return {
          ...c,
          messages: [
            ...c.messages,
            {
              id: `tmp-${Date.now()}`,
              sender: "me",
              text,
              sentAt: new Date().toISOString(),
            },
          ],
          lastMessageText: text,
          lastMessageAt: new Date().toISOString(),
        };
      })
    );
  }

  // Load messages for initial selection once it is known
  useEffect(() => {
    if (!selectedConversationId || !myUserId) return;

    loadMessagesForConversation(selectedConversationId, myUserId).catch(console.error);
  }, [selectedConversationId, myUserId]);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-off-white">
        <div className="text-gray-muted">Loading chats...</div>
      </div>
    );
  }

  if (!myUserId) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-off-white">
        <div className="text-gray-muted">Please sign in to view chats.</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-off-white">
        <div className="text-gray-muted">No conversations yet.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-off-white">
      <Chat
        conversations={conversations}
        selectedConversationId={selectedConversationId ?? conversations[0]?.conversationId ?? ""}
        onSelectConversationId={(id) => {
          setSelectedConversationId(id);
          router.replace(`/chats?c=${encodeURIComponent(id)}`);
          if (myUserId) loadMessagesForConversation(id, myUserId).catch(console.error);
        }}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
}
