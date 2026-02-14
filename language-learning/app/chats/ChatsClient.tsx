"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Chat, { Conversation } from "@/components/chat/Chat";
import { supabase } from "@/lib/supabaseClient";

type DbConversation = {
  id: string;
  last_message_at: string | null;
  last_message_text: string | null;
};

type DbParticipant = {
  conversation_id: string;
  user_id: string;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

type DbProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
};

export default function ChatsClient({ cFromUrl }: { cFromUrl: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const c = searchParams.get("c") ?? cFromUrl;

  useEffect(() => {
    if (!selectedConversationId || !myUserId) return;

    // Subscribe to INSERTs for this conversation
    const channel = supabase
      .channel(`messages:${selectedConversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${selectedConversationId}`,
        },
        (payload) => {
          const m = payload.new as DbMessage;

          // Map DB → UI message shape
          const uiMsg = {
            id: m.id,
            sender: m.sender_id === myUserId ? "me" as const : "partner" as const,
            text: m.body,
            sentAt: m.created_at,
          };

          setConversations((prev) =>
            prev.map((c) => {
              if (c.conversationId !== selectedConversationId) return c;

              // Dedup: if we already have this id, do nothing
              if (c.messages.some((x) => x.id === uiMsg.id)) return c;

              return {
                ...c,
                messages: [...c.messages, uiMsg],
                lastMessageText: uiMsg.text,
                lastMessageAt: uiMsg.sentAt,
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversationId, myUserId]);

  // Load conversation list (sidebar)
  useEffect(() => {
    let cancelled = false;

    async function loadList() {
      setLoading(true);

      const { data: authData, error: authErr } = await supabase.auth.getUser();
      if (cancelled) return;

      const user = authData?.user;
      if (authErr || !user) {
        setMyUserId(null);
        setConversations([]);
        setSelectedConversationId(null);
        setLoading(false);
        return;
      }

      setMyUserId(user.id);

      // Get conversation IDs I'm in
      const { data: myParts, error: partsErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id")
        .eq("user_id", user.id);

      if (partsErr) throw partsErr;

      const convoIds = (myParts ?? []).map((r: any) => r.conversation_id);
      if (convoIds.length === 0) {
        setConversations([]);
        setSelectedConversationId(null);
        setLoading(false);
        return;
      }

      // Fetch conversations
      const { data: convos, error: convosErr } = await supabase
        .from("conversations")
        .select("id,last_message_at,last_message_text")
        .in("id", convoIds)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (convosErr) throw convosErr;

      // Fetch participants for those conversations (to find partner id)
      const { data: parts, error: allPartsErr } = await supabase
        .from("conversation_participants")
        .select("conversation_id,user_id")
        .in("conversation_id", convoIds);

      if (allPartsErr) throw allPartsErr;

      const partnerByConvo = new Map<string, string>();
      for (const row of (parts as DbParticipant[]) ?? []) {
        if (row.user_id !== user.id) {
          partnerByConvo.set(row.conversation_id, row.user_id);
        }
      }

      // compute partnerIds
      const partnerIds = Array.from(new Set(Array.from(partnerByConvo.values()))).filter(Boolean);

      // Fetch partner profiles
      const profilesById = new Map<string, DbProfile>();
      if (partnerIds.length > 0) {
        const { data: profs, error: profErr } = await supabase
          .from("profiles")
          .select("user_id, first_name, last_name, profile_picture_url")
          .in("user_id", partnerIds);

        if (profErr) throw profErr;

        for (const p of (profs as DbProfile[]) ?? []) {
          profilesById.set(p.user_id, p);
        }
      }

      // Fetch partner target languages (choose first language per partner)
      const targetLangByUser = new Map<string, string>();
      if (partnerIds.length > 0) {
        const { data: tlRows, error: tlErr } = await supabase
          .from("profile_target_languages")
          .select("user_id, lang:languages!profile_target_languages_language_id_fkey(name)")
          .in("user_id", partnerIds);

        if (tlErr) throw tlErr;

        for (const r of (tlRows as any[]) ?? []) {
          if (!targetLangByUser.has(r.user_id)) {
            targetLangByUser.set(r.user_id, r.lang?.name ?? "Unknown");
          }
        }
      }

      // Build UI conversations (profiles + language)
      const ui: Conversation[] = ((convos as DbConversation[]) ?? []).map((c) => {
        const partnerId = partnerByConvo.get(c.id) ?? "unknown";
        const p = profilesById.get(partnerId);

        const first = p?.first_name ?? "User";
        const last = p?.last_name ?? (partnerId === "unknown" ? "" : partnerId.slice(0, 6));
        const avatar = p?.profile_picture_url ?? null;

        return {
          conversationId: c.id,
          partnerId,
          partnerFirstName: first,
          partnerLastName: last,
          partnerAvatarUrl: avatar,
          language: targetLangByUser.get(partnerId) ?? "Unknown",
          lastMessageText: c.last_message_text ?? "",
          lastMessageAt: c.last_message_at ?? new Date(0).toISOString(),
          unreadCount: 0,
          messages: [],
        };
      });

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
    const { data, error } = await supabase
      .from("messages")
      .select("id,conversation_id,sender_id,body,created_at")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const msgs = (data as DbMessage[]) ?? [];
    const last = msgs.length > 0 ? msgs[msgs.length - 1] : null;

    setConversations((prev) =>
      prev.map((c) =>
        c.conversationId === conversationId
          ? {
              ...c,
              messages: msgs.map((m) => ({
                id: m.id,
                sender: m.sender_id === userId ? "me" : "partner",
                text: m.body,
                sentAt: m.created_at,
              })),
              lastMessageText: last?.body ?? c.lastMessageText,
              lastMessageAt: last?.created_at ?? c.lastMessageAt,
            }
          : c
      )
    );
  }

  async function sendMessageToDb(conversationId: string, text: string) {
    if (!myUserId) throw new Error("Not signed in");

    // 1) insert into messages (this triggers the last_message_* trigger)
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_id: myUserId,
      body: text,
    });

    if (error) throw error;

    // 2) reload messages for this conversation
    await loadMessagesForConversation(conversationId, myUserId);
  }

  // Load messages for initial selection once it’s known
  useEffect(() => {
    if (!selectedConversationId || !myUserId) return;

    loadMessagesForConversation(selectedConversationId, myUserId).catch(console.error);
  }, [selectedConversationId, myUserId]);

  if (loading) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-600">Loading chats…</div>
      </div>
    );
  }

  if (!myUserId) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-600">Please sign in to view chats.</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-zinc-50">
        <div className="text-zinc-600">No conversations yet.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-hidden bg-zinc-50">
      <Chat
        conversations={conversations}
        selectedConversationId={selectedConversationId ?? conversations[0]?.conversationId ?? ""}
        onSelectConversationId={(id) => {
          setSelectedConversationId(id);
          router.replace(`/chats?c=${encodeURIComponent(id)}`);
          if (myUserId) loadMessagesForConversation(id, myUserId).catch(console.error);
        }}
        onSendMessage={sendMessageToDb}
      />
    </div>
  );
}
