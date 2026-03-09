"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Chat, { Conversation } from "@/components/chat/Chat";

type ApiMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body?: string;
  content?: string;
  type?: "text" | "voice";
  voice_path?: string | null;
  created_at: string;
};

type ProfileForChats = {
  nativeLanguage?: string | null;
};

type TypingEventPayload = {
  userId?: string;
  isTyping?: boolean;
  ts?: number;
};

type RealtimeMessagePayload = {
  id?: string;
  conversationId?: string;
  senderId?: string;
  content?: string;
  type?: "text" | "voice";
  createdAt?: string;
};

type UiMessage = {
  id: string;
  sender: "me" | "partner";
  text: string;
  content: string;
  type: "text" | "voice";
  sentAt: string;
};

function toUiMessage(args: {
  id: string;
  sender: "me" | "partner";
  content: string;
  type: "text" | "voice";
  sentAt: string;
}): UiMessage {
  return {
    id: args.id,
    sender: args.sender,
    text: args.content,
    content: args.content,
    type: args.type,
    sentAt: args.sentAt,
  };
}

export default function ChatsClient({ cFromUrl }: { cFromUrl: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myNativeLanguage, setMyNativeLanguage] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [typingByConversationId, setTypingByConversationId] = useState<Record<string, boolean>>({});

  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const c = searchParams.get("c") ?? cFromUrl;

  // Load conversation list (sidebar)
  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      setLoading(true);

      try {
        const [chatsRes, profileRes] = await Promise.all([
          fetch("/api/chats"),
          fetch("/api/profile/me"),
        ]);

        const chatsBody = await chatsRes.json();
        if (!chatsRes.ok) {
          throw new Error(chatsBody?.error || "Failed to load chats");
        }

        const profileBody = await profileRes.json().catch(() => null);

        if (!cancelled) {
          setMyUserId(chatsBody?.myUserId ?? null);

          const ui: Conversation[] = (chatsBody?.conversations ?? []).map((c: Conversation) => ({
            ...c,
            messages: [],
          }));

          const preferred =
            c && ui.some((x) => x.conversationId === c)
              ? c
              : ui[0]?.conversationId ?? null;

          const profile: ProfileForChats | null =
            profileBody && typeof profileBody === "object" ? (profileBody.profile as ProfileForChats) : null;

          setMyNativeLanguage(profile?.nativeLanguage ?? null);

          setConversations(ui);
          setSelectedConversationId(preferred);
          setLoading(false);
        }
      } catch (e) {
        console.error("loadList failed:", (e as any)?.message ?? e, e);
        if (!cancelled) {
          setLoading(false);
        }
      }

    }

    loadList();

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

    const ui = data.map((m) => {
      const resolvedContent = m.content ?? m.body ?? "";
      const inferredType: "text" | "voice" =
        m.type === "voice" || !!m.voice_path || resolvedContent.startsWith("voice:")
          ? "voice"
          : "text";

      return {
        id: m.id,
        sender: m.sender_id === userId ? ("me" as const) : ("partner" as const),
        text: resolvedContent,      // required by Conversation.Message
        content: resolvedContent,   // keep new field too
        type: inferredType,
        sentAt: m.created_at,
      };
    });

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

  function appendMessage(conversationId: string, message: UiMessage) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.conversationId !== conversationId) return c;
        if (c.messages.some((m) => m.id === message.id)) return c; // dedupe
        return { ...c, messages: [...c.messages, message] };
      })
    );
  }

  async function handleSendMessage(
    conversationId: string,
    content: string,
    type: "text" | "voice" = "text",
    extras?: { voicePath?: string; voiceBucket?: string }
  ) {
    const res = await fetch(`/api/chats/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        type,
        voicePath: extras?.voicePath,
        voiceBucket: extras?.voiceBucket,
      }),
    });

    const body = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error("send failed:", body);
      throw new Error(body?.error || "Failed to send message");
    }

    const resolvedContent = body?.message?.content ?? content;
    const resolvedType = (body?.message?.type as "text" | "voice") ?? type;

    appendMessage(
      conversationId,
      toUiMessage({
        id: body?.message?.id ?? `tmp-${Date.now()}`,
        sender: "me",
        content: resolvedContent,
        type: resolvedType,
        sentAt: body?.message?.created_at ?? new Date().toISOString(),
      })
    );

    setTypingByConversationId((prev) =>
      prev[conversationId] ? { ...prev, [conversationId]: false } : prev
    );
  }

  async function handleTypingChange(conversationId: string, isTyping: boolean) {
    if (!myUserId) return;

    try {
      await fetch(`/api/chats/room/${encodeURIComponent(conversationId)}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: myUserId, isTyping }),
      });
    } catch (error) {
      console.error("typing update failed:", error);
    }
  }

  // Load messages for initial selection once it is known
  useEffect(() => {
    if (!selectedConversationId || !myUserId) return;

    loadMessagesForConversation(selectedConversationId, myUserId).catch(console.error);
  }, [selectedConversationId, myUserId]);

  useEffect(() => {
    if (!selectedConversationId || !myUserId) return;

    const conversationId = selectedConversationId;
    const eventSource = new EventSource(
      `/api/chats/room/${encodeURIComponent(conversationId)}/events?userId=${encodeURIComponent(myUserId)}`
    );

    const clearTypingTimeout = () => {
      const timeout = typingTimeoutsRef.current[conversationId];
      if (timeout) {
        clearTimeout(timeout);
        delete typingTimeoutsRef.current[conversationId];
      }
    };

    const setPartnerTyping = (isTyping: boolean) => {
      setTypingByConversationId((prev) =>
        prev[conversationId] === isTyping ? prev : { ...prev, [conversationId]: isTyping }
      );
    };

    const handleTyping = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as TypingEventPayload;

        if (payload.userId === myUserId || typeof payload.isTyping !== "boolean") {
          return;
        }

        if (!payload.isTyping) {
          clearTypingTimeout();
          setPartnerTyping(false);
          return;
        }

        setPartnerTyping(true);
        clearTypingTimeout();
        typingTimeoutsRef.current[conversationId] = setTimeout(() => {
          setPartnerTyping(false);
          delete typingTimeoutsRef.current[conversationId];
        }, 4000);
      } catch (error) {
        console.error("invalid typing event:", error);
      }
    };

    eventSource.onopen = () => {
      console.log("[sse] connected:", conversationId);
    };

    eventSource.onerror = (err) => {
      console.error("[sse] error:", conversationId, err);
      // optional safety refresh if socket is unstable
      if (myUserId) loadMessagesForConversation(conversationId, myUserId).catch(console.error);
    };

    const handleMessage = (event: MessageEvent<string>) => {
      try {
        const payload = JSON.parse(event.data) as RealtimeMessagePayload;
        if (!payload?.id || !payload?.conversationId) return;
        if (payload.conversationId !== conversationId) return;

        const resolvedContent = payload.content ?? "";
        const resolvedType: "text" | "voice" = payload.type === "voice" ? "voice" : "text";

        appendMessage(
          conversationId,
          toUiMessage({
            id: payload.id,
            sender: payload.senderId === myUserId ? "me" : "partner",
            content: resolvedContent,
            type: resolvedType,
            sentAt: payload.createdAt ?? new Date().toISOString(),
          })
        );
      } catch (error) {
        console.error("invalid message event:", error);
      }
    };

    eventSource.addEventListener("typing", handleTyping as EventListener);
    eventSource.addEventListener("message", handleMessage as EventListener);

    return () => {
      clearTypingTimeout();
      setPartnerTyping(false);
      eventSource.removeEventListener("typing", handleTyping as EventListener);
      eventSource.removeEventListener("message", handleMessage as EventListener);
      eventSource.close();
    };
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
        myNativeLanguage={myNativeLanguage}
        onSelectConversationId={(id) => {
          setSelectedConversationId(id);
          router.replace(`/chats?c=${encodeURIComponent(id)}`);
          if (myUserId) loadMessagesForConversation(id, myUserId).catch(console.error);
        }}
        onSendMessage={handleSendMessage}
        onTypingChange={handleTypingChange}
        isPartnerTyping={
          selectedConversationId ? Boolean(typingByConversationId[selectedConversationId]) : false
        }
      />
    </div>
  );
}
