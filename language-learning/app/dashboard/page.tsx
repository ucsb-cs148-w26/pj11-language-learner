"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { createFriendService } from "@/utils/friends/friendService";
import FriendsList from "@/components/friends/list";
import ChatLeftPanel from "@/components/chat/ChatLeftPanel";

function levelToDisplay(level: string | null | undefined): "Beginner" | "Intermediate" | "Advanced" | null {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

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

type LoadState<T> =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

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

async function getUserId(): Promise<string> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user) return sessionData.session.user.id;

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (userData.user) return userData.user.id;

  throw new Error("Not authenticated");
}

function getLangName(
  lang: ProfileTLRow["lang"]
): string | null {
  if (!lang) return null;
  if (Array.isArray(lang)) return lang[0]?.name ?? null;
  return lang.name ?? null;
}

async function fetchDashboard(): Promise<DashboardData> {
  const userId = await getUserId();

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("native_language, profile_picture_url")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError && profileError.code !== "PGRST116") {
    throw profileError;
  }

  const { data: targetLanguagesData, error: tlErr } = await supabase
    .from("profile_target_languages")
    .select("level, lang:languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId)

  if (tlErr) throw tlErr;

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

  if (myPartsErr) throw myPartsErr;

  const convoIds = (myParts ?? []).map((r: { conversation_id: string }) => r.conversation_id);

  let chats: DashboardData["chats"] = [];

  if (convoIds.length > 0) {
    const { data: convos, error: convosErr } = await supabase
      .from("conversations")
      .select("id,last_message_text,last_message_at,created_at")
      .in("id", convoIds);

    if (convosErr) throw convosErr;

    const { data: parts, error: partsErr } = await supabase
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", convoIds);

    if (partsErr) throw partsErr;

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

    if (profsErr) throw profsErr;

    const profileById = new Map<string, ProfileRow>();
    for (const p of (profs as ProfileRow[] | null) ?? []) {
      profileById.set(p.user_id, p);
    }

    chats = ((convos as ConversationRow[] | null) ?? []).map((c) => {
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
    }).filter(c => c.partnerId !== "");
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
      .select("user_id, first_name, last_name")
      .in("user_id", friendIds);

    if (friendProfilesError) throw friendProfilesError;

    const { data: friendTLs, error: friendTLsError } = await supabase
      .from("profile_target_languages")
      .select("user_id, level, lang:languages!profile_target_languages_language_id_fkey(name)")
      .in("user_id", friendIds);

    if (friendTLsError) throw friendTLsError;

    const profileById = new Map<string, { first_name: string | null; last_name: string | null }>();
    for (const p of (friendProfiles as ProfileRow[] | null) ?? []) {
      profileById.set(p.user_id, { first_name: p.first_name, last_name: p.last_name });
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
      };
    });
  }

  return { user: userProfile, friends, chats };
}

export default function DashboardPage() {
  const [state, setState] = useState<LoadState<DashboardData>>({ status: "idle" });
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState({ status: "loading" });
      try {
        const data = await fetchDashboard();
        if (!cancelled) setState({ status: "success", data });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const content = useMemo(() => {
    if (state.status === "loading" || state.status === "idle") {
      return <SkeletonDashboard />;
    }
    if (state.status === "error") {
      return (
        <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
          <p className="font-medium text-dark-red">Couldn’t load dashboard</p>
          <p className="mt-1 text-sm text-dark-red">{state.message}</p>
          <button
            className="mt-3 rounded-xl bg-dark-red px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            onClick={() => location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    if (state.status !== "success") return null;

    const { user, friends, chats } = state.data;

    const convoIdByPartner = new Map(chats.map((c) => [c.partnerId, c.id]));

    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-text">Dashboard</h1>
        </header>

        <Link
          href="/profile"
          className="block rounded-2xl border border-gray-border-soft bg-white p-6 transition-colors hover:bg-off-white"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="h-20 w-20 rounded-full border-2 border-gray-border-soft object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-gray-border-soft bg-gray-soft-2">
                  <svg className="h-10 w-10 text-gray-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-gray-text">Profile</h2>
                  <div className="mt-2 space-y-1">
                    {user.targetLanguages.length > 0 ? (
                      <p className="text-sm text-gray-muted">
                        <span className="font-medium">Learning:</span> {" "}
                        {user.targetLanguages
                          .map((t) => `${t.name}${t.level ? ` • ${t.level}` : ""}`)
                          .join(", ")}
                      </p>
                    ) : (
                      <p className="text-sm italic text-gray-muted">Set your target language to get started</p>
                    )}
                    {user.nativeLanguage && (
                      <p className="text-sm text-gray-muted">
                        <span className="font-medium">Native:</span> {user.nativeLanguage}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-sm text-gray-muted">
                  <span>View Profile</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-text">Friends</h2>
              <div className="flex items-center gap-3">
                <Link href="/requests" className="text-sm font-medium text-gray-muted hover:text-gray-text">
                  Requests
                </Link>
                <Link href="/discover" className="text-sm font-medium text-gray-muted hover:text-gray-text">
                  Find more
                </Link>
              </div>
            </div>

            <FriendsList
              showHeader={false}
              showSubHeader={false}
              removingIds={removingIds}
              friends={friends.map((f) => {
                const convoId = convoIdByPartner.get(f.id);
                return {
                  id: f.id,
                  name: f.name,
                  profileHref: `/profile/${f.id}`,
                  chatHref: convoId ? `/chats?c=${encodeURIComponent(convoId)}` : "/chats",
                };
              })}
              onRemove={async (friendId) => {
                if (state.status !== "success") return;

                const prev = state.data;

                setRemovingIds((s) => new Set(s).add(friendId));
                setState({
                  status: "success",
                  data: { ...prev, friends: prev.friends.filter((x) => x.id !== friendId) },
                });

                try {
                  const svc = createFriendService(supabase);
                  await svc.unfriend({ otherUserId: friendId });
                  const data = await fetchDashboard();
                  setState({ status: "success", data });
                } catch (e) {
                  setState({ status: "success", data: prev });
                  alert(e instanceof Error ? e.message : "Failed to remove friend");
                } finally {
                  setRemovingIds((s) => {
                    const next = new Set(s);
                    next.delete(friendId);
                    return next;
                  });
                }
              }}
            />
          </section>

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-text">Recent Chats</h2>
              {chats.length > 0 && (
                <Link href="/chats" className="text-sm font-medium text-gray-muted hover:text-gray-text">
                  View all
                </Link>
              )}
            </div>

            {chats.length === 0 ? (
              <div className="rounded-2xl border border-gray-border p-6 text-center text-sm text-gray-muted bg-white">No chats yet.</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-border bg-white">
                <ChatLeftPanel
                  linkMode
                  showHeader={false}
                  outerBorder={false}
                  containerClassName="border-0 border-gray-border bg-transparent"
                  chats={chats.map((c) => ({
                    conversationId: c.id,
                    createdAt: c.createdAt,
                    partnerId: c.partnerId,
                    partnerFirstName: c.partnerName.split(" ")[0],
                    partnerLastName: c.partnerName.split(" ")[1] ?? "",
                    partnerAvatarUrl: null,
                    lastMessageText: c.lastMessage ?? "",
                    lastMessageAt: c.lastMessageAt ?? null,
                    unreadCount: c.unreadCount,
                  }))}
                />
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }, [state, removingIds]);

  return <div className="mx-auto w-full p-6">{content}</div>;
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-gray-border-soft" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-gray-border-soft" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-border-soft" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-gray-border-soft" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-border-soft" />
        </div>
      </div>
    </div>
  );
}