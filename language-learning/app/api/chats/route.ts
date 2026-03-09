import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

type DbConversation = {
  id: string;
  last_message_at: string | null;
  last_message_text: string | null;
  created_at: string;
};

type DbParticipant = {
  conversation_id: string;
  user_id: string;
};

type DbProfile = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url: string | null;
};

type Conversation = {
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
};

type DbUnreadMessage = {
  conversation_id: string;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { data: myParts, error: partsErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (partsErr) {
    return NextResponse.json({ error: partsErr.message || "Failed to load conversations" }, { status: 500 });
  }

  const convoIds = (myParts ?? []).map((r: { conversation_id: string }) => r.conversation_id);
  if (convoIds.length === 0) {
    return NextResponse.json({ myUserId: userId, conversations: [] });
  }

  const { data: convos, error: convosErr } = await supabase
    .from("conversations")
    .select("id,last_message_at,last_message_text,created_at")
    .in("id", convoIds)
    .order("last_message_at", { ascending: false, nullsFirst: false });

  if (convosErr) {
    return NextResponse.json({ error: convosErr.message || "Failed to load chats" }, { status: 500 });
  }

  const { data: parts, error: allPartsErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id,user_id")
    .in("conversation_id", convoIds);

  if (allPartsErr) {
    return NextResponse.json({ error: allPartsErr.message || "Failed to load chat participants" }, { status: 500 });
  }

  const partnerByConvo = new Map<string, string>();
  for (const row of (parts as DbParticipant[] | null) ?? []) {
    if (row.user_id !== userId) {
      partnerByConvo.set(row.conversation_id, row.user_id);
    }
  }

  const partnerIds = Array.from(new Set(Array.from(partnerByConvo.values()))).filter(Boolean);

  const profilesById = new Map<string, DbProfile>();
  if (partnerIds.length > 0) {
    const { data: profs, error: profErr } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, profile_picture_url")
      .in("user_id", partnerIds);

    if (profErr) {
      return NextResponse.json({ error: profErr.message || "Failed to load profiles" }, { status: 500 });
    }

    for (const p of (profs as DbProfile[] | null) ?? []) {
      profilesById.set(p.user_id, p);
    }
  }

  const targetLangNamesByUser = new Map<string, string[]>();
  if (partnerIds.length > 0) {
    const { data: tlRows, error: tlErr } = await supabase
      .from("profile_target_languages")
      .select("user_id, lang:languages!profile_target_languages_language_id_fkey(name)")
      .in("user_id", partnerIds);

    if (tlErr) {
      return NextResponse.json({ error: tlErr.message || "Failed to load target languages" }, { status: 500 });
    }

    for (const r of (tlRows as any[]) ?? []) {
      const name = r?.lang?.name ?? null;
      if (!name) continue;

      const existing = targetLangNamesByUser.get(r.user_id) ?? [];
      if (!existing.includes(name)) {
        targetLangNamesByUser.set(r.user_id, [...existing, name]);
      }
    }
  }

  const unreadByConvo = new Map<string, number>();
  if (convoIds.length > 0) {
    const { data: unreadRows, error: unreadErr } = await supabase
      .from("messages")
      .select("conversation_id")
      .in("conversation_id", convoIds)
      .neq("sender_id", userId)
      .is("read_at", null);

    if (unreadErr) {
      return NextResponse.json({ error: unreadErr.message || "Failed to load unread counts" }, { status: 500 });
    }

    for (const row of (unreadRows as DbUnreadMessage[] | null) ?? []) {
      unreadByConvo.set(row.conversation_id, (unreadByConvo.get(row.conversation_id) ?? 0) + 1);
    }
  }

  const conversations: Conversation[] = ((convos as DbConversation[]) ?? []).map((c) => {
    const partnerId = partnerByConvo.get(c.id) ?? "unknown";
    const p = profilesById.get(partnerId);

    const first = p ? (p.first_name ?? "") : "Deleted";
    const last = p ? (p.last_name ?? "") : "User";
    const avatar = p?.profile_picture_url ?? null;

    return {
      conversationId: c.id,
      createdAt: c.created_at,
      partnerId,
      partnerFirstName: first,
      partnerLastName: last,
      partnerAvatarUrl: avatar,
      targetLanguages: targetLangNamesByUser.get(partnerId) ?? [],
      lastMessageText: c.last_message_text ?? "No messages yet",
      lastMessageAt: c.last_message_at,
      unreadCount: unreadByConvo.get(c.id) ?? 0,
    };
  });

  return NextResponse.json(
    { myUserId: userId, conversations },
    { headers: { "Cache-Control": "no-store" } }
  );
}
