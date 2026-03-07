import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createFriendService } from "@/utils/friends/friendService";

type TargetLanguages = {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
};

type DashboardData = {
  user: {
    targetLanguages: TargetLanguages[];
    profilePicture?: string | null;
    nativeLanguage?: string | null;
  };
  friends: Array<{
    id: string;
    name: string;
    targetLanguage: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    lastActive?: string | null;
    avatarUrl?: string | null;
  }>;
  chats: Array<{
    id: string;
    partnerId: string;
    partnerName: string;
    lastMessage?: string | null;
    lastMessageAt?: string | null;
    createdAt: string;
    unreadCount: number;
  }>;
};

type ProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  profile_picture_url?: string | null;
  native_language?: string | null;
};

type ProfileTLRow = {
  user_id: string;
  level: string | null;
  lang: { name: string | null } | Array<{ name: string | null }> | null;
};

type ConversationRow = {
  id: string;
  last_message_text: string | null;
  last_message_at: string | null;
  created_at: string;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
};

function levelToDisplay(level: string | null | undefined): "Beginner" | "Intermediate" | "Advanced" | null {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

function getLangName(lang: ProfileTLRow["lang"]): string | null {
  if (!lang) return null;
  if (Array.isArray(lang)) return lang[0]?.name ?? null;
  return lang.name ?? null;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = user.id;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("native_language, profile_picture_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json({ error: profileError.message || "Failed to load profile" }, { status: 500 });
  }

  const { data: targetLanguagesData, error: tlErr } = await supabase
    .from("profile_target_languages")
    .select("level, lang:languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId);

  if (tlErr) {
    return NextResponse.json({ error: tlErr.message || "Failed to load target languages" }, { status: 500 });
  }

  const targetLanguages: TargetLanguages[] = (targetLanguagesData ?? [])
    .map((row: any) => {
      const name = row?.lang?.name ?? null;
      if (!name) return null;
      return { name, level: levelToDisplay(row.level) };
    })
    .filter(Boolean) as TargetLanguages[];

  const userProfile = {
    targetLanguages,
    profilePicture: profileData?.profile_picture_url ?? null,
    nativeLanguage: profileData?.native_language ?? null,
  };

  const { data: myParts, error: myPartsErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  if (myPartsErr) {
    return NextResponse.json({ error: myPartsErr.message || "Failed to load conversations" }, { status: 500 });
  }

  const convoIds = (myParts ?? []).map((r: { conversation_id: string }) => r.conversation_id);

  let chats: DashboardData["chats"] = [];

  if (convoIds.length > 0) {
    const { data: convos, error: convosErr } = await supabase
      .from("conversations")
      .select("id,last_message_text,last_message_at,created_at")
      .in("id", convoIds);

    if (convosErr) {
      return NextResponse.json({ error: convosErr.message || "Failed to load chats" }, { status: 500 });
    }

    const { data: parts, error: partsErr } = await supabase
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", convoIds);

    if (partsErr) {
      return NextResponse.json({ error: partsErr.message || "Failed to load chat participants" }, { status: 500 });
    }

    const partnerByConvo = new Map<string, string>();
    for (const p of (parts as ConversationParticipantRow[] | null) ?? []) {
      if (p.user_id !== userId) {
        partnerByConvo.set(p.conversation_id, p.user_id);
      }
    }

    const partnerIds = [...new Set(partnerByConvo.values())];

    const { data: profs, error: profsErr } = await supabase
      .from("profiles")
      .select("user_id,first_name,last_name")
      .in("user_id", partnerIds);

    if (profsErr) {
      return NextResponse.json({ error: profsErr.message || "Failed to load profiles" }, { status: 500 });
    }

    const profileById = new Map<string, ProfileRow>();
    for (const p of (profs as ProfileRow[] | null) ?? []) {
      profileById.set(p.user_id, p);
    }

    chats = ((convos as ConversationRow[] | null) ?? [])
      .map((c) => {
        const pid = partnerByConvo.get(c.id);
        const prof = pid ? profileById.get(pid) : undefined;

        const partnerName = prof
          ? `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim() || "Unnamed User"
          : "Deleted User";

        return {
          id: c.id,
          partnerId: pid ?? "",
          partnerName,
          lastMessage: c.last_message_text,
          lastMessageAt: c.last_message_at,
          createdAt: c.created_at,
          unreadCount: 0,
        };
      })
      .filter((c) => c.partnerId !== "");
  }

  chats.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt ?? a.createdAt).getTime();
    const bTime = new Date(b.lastMessageAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  const friendService = createFriendService(supabase);
  const friendEdges = await friendService.getFriendsList({ userId, limit: 50 });

  let friends: DashboardData["friends"] = [];

  if (friendEdges.length > 0) {
    const friendIds = friendEdges.map((e) => e.friend_user_id);

    const { data: friendProfiles, error: friendProfilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name, profile_picture_url")
      .in("user_id", friendIds);

    if (friendProfilesError) {
      return NextResponse.json({ error: friendProfilesError.message || "Failed to load friend profiles" }, { status: 500 });
    }

    const { data: friendTLs, error: friendTLsError } = await supabase
      .from("profile_target_languages")
      .select("user_id, level, lang:languages!profile_target_languages_language_id_fkey(name)")
      .in("user_id", friendIds);

    if (friendTLsError) {
      return NextResponse.json({ error: friendTLsError.message || "Failed to load friend languages" }, { status: 500 });
    }

    const profileById = new Map<string, { first_name: string | null; last_name: string | null; profile_picture_url: string | null }>();
    for (const p of (friendProfiles as ProfileRow[] | null) ?? []) {
      profileById.set(p.user_id, { first_name: p.first_name, last_name: p.last_name, profile_picture_url: p.profile_picture_url ?? null });
    }

    const tlById = new Map<
      string,
      { targetLanguage: string | null; level: "Beginner" | "Intermediate" | "Advanced" }
    >();

    for (const row of (friendTLs as ProfileTLRow[] | null) ?? []) {
      if (tlById.has(row.user_id)) continue;
      const tlName = getLangName(row.lang);
      tlById.set(row.user_id, {
        targetLanguage: tlName,
        level: levelToDisplay(row.level) ?? "Beginner",
      });
    }

    friends = friendEdges.map((edge) => {
      const prof = profileById.get(edge.friend_user_id);
      const tl = tlById.get(edge.friend_user_id);

      const name = prof
        ? `${prof.first_name ?? ""} ${prof.last_name ?? ""}`.trim() || "Unnamed User"
        : "Deleted User";

      return {
        id: edge.friend_user_id,
        name,
        targetLanguage: tl?.targetLanguage ?? "Unknown",
        level: tl?.level ?? "Beginner",
        avatarUrl: prof?.profile_picture_url ?? null,
      };
    });
  }

  const payload: DashboardData = { user: userProfile, friends, chats };
  return NextResponse.json(payload);
}
