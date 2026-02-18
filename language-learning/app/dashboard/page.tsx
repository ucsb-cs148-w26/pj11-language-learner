// app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { createFriendService } from "@/utils/friends/friendService";
import FriendsList from "@/components/friends/list";
import ChatLeftPanel from "@/components/chat/ChatLeftPanel";

// Helper function to convert database level to display format
function levelToDisplay(level: string | null | undefined): "Beginner" | "Intermediate" | "Advanced" | null {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

type DashboardData = {
  user: {
    targetLanguage?: string | null;
    profilePicture?: string | null;
    level?: "Beginner" | "Intermediate" | "Advanced" | null;
    nativeLanguage?: string | null;
  };
  friends: Array<{
    id: string;
    name: string;
    targetLanguage: string;
    level: "Beginner" | "Intermediate" | "Advanced";
    lastActive?: string | null; // ISO
  }>;
  chats: Array<{
    id: string;
    partnerId: string;
    partnerName: string;
    lastMessage?: string | null;
    lastMessageAt?: string | null; // ISO
    createdAt: string;
    unreadCount: number;
  }>;
};

type LoadState<T> =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function getUserId(): Promise<string> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (session?.user) return session.user.id;

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (user) return user.id;

  throw new Error("Not authenticated");
}

async function fetchDashboard(): Promise<DashboardData> {
  const userId = await getUserId();

  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('native_language, profile_picture_url')
    .eq('user_id', userId)
    .maybeSingle(); // Use maybeSingle to avoid errors when no row exists

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    console.error("Error code:", profileError.code);
    console.error("Error message:", profileError.message);
    console.error("Error details:", profileError.details);
    // Don't throw on PGRST116 (no rows) - that's expected for new users
    if (profileError.code !== 'PGRST116') {
      throw profileError;
    }
  }

  // Fetch target languages from separate table
  const { data: targetLanguagesData } = await supabase
    .from("profile_target_languages")
    .select("level, lang:languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId)
    .limit(1);

  // Get first target language (or null if none)
  const firstTL =
    targetLanguagesData && targetLanguagesData.length > 0 ? targetLanguagesData[0] : null;

  const langObj = Array.isArray((firstTL as any)?.lang) ? (firstTL as any).lang[0] : (firstTL as any)?.lang;
  const targetLanguage = langObj?.name ?? null;
  // const targetLanguage = firstTL?.lang?.name ?? null; 

  const userProfile = profileData ? {
    targetLanguage: targetLanguage,
    profilePicture: profileData.profile_picture_url,
    level: levelToDisplay(firstTL?.level),
    nativeLanguage: profileData.native_language,
  } : {
    targetLanguage: null,
    profilePicture: null,
    level: null,
    nativeLanguage: null,
  };

  // Fetch Chats
  const { data: myParts } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);

  const convoIds = (myParts ?? []).map(r => r.conversation_id);

  let chats: DashboardData["chats"] = [];

  if (convoIds.length > 0) {
    const { data: convos } = await supabase
      .from("conversations")
      .select("id,last_message_text,last_message_at,created_at")
      .in("id", convoIds)

    const { data: parts } = await supabase
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", convoIds);

    const partnerByConvo = new Map<string,string>();
    for (const p of parts ?? []) {
      if (p.user_id !== userId) {
        partnerByConvo.set(p.conversation_id, p.user_id);
      }
    }

    const partnerIds = [...new Set(partnerByConvo.values())];

    const { data: profs } = await supabase
      .from("profiles")
      .select("user_id,first_name,last_name")
      .in("user_id", partnerIds);

    const profileById = new Map(profs?.map(p => [p.user_id, p]) ?? []);

    chats = (convos ?? []).map(c => {
      const pid = partnerByConvo.get(c.id)!;
      const prof = profileById.get(pid);

      return {
        id: c.id,
        partnerId: pid,
        partnerName:
          prof ? `${prof.first_name ?? ""} ${prof.last_name ?? ""}` : "Deleted User",
        lastMessage: c.last_message_text,
        lastMessageAt: c.last_message_at,
        createdAt: c.created_at,
        unreadCount: 0,
      };
    });
  }

  chats.sort((a, b) => {
    const aTime = new Date(a.lastMessageAt ?? a.createdAt).getTime();
    const bTime = new Date(b.lastMessageAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });

  // Fetch friends
    // ------------------------------------------------------------------
  // Fetch Friends (real data)
  // ------------------------------------------------------------------
  const friendService = createFriendService(supabase);

  // 1) Get friend edges from the friends table (sorted by created_at desc already)
  const friendEdges = await friendService.getFriendsList({ userId, limit: 50 });

  // If none, keep empty
  let friends: DashboardData["friends"] = [];

  if (friendEdges.length > 0) {
    const friendIds = friendEdges.map(e => e.friend_user_id);

    // 2) Fetch basic profile info for friends (name)
    const { data: friendProfiles, error: friendProfilesError } = await supabase
      .from("profiles")
      .select("user_id, first_name, last_name")
      .in("user_id", friendIds);

    if (friendProfilesError) throw friendProfilesError;

    // 3) Fetch friends' target language + level (take first TL per friend)
    const { data: friendTLs, error: friendTLsError } = await supabase
      .from("profile_target_languages")
      .select("user_id, level, lang:languages!profile_target_languages_language_id_fkey(name)")
      .in("user_id", friendIds);

    if (friendTLsError) throw friendTLsError;

    // Build maps for quick lookup
    const profileById = new Map<string, { first_name: string | null; last_name: string | null }>();
    for (const p of friendProfiles ?? []) {
      profileById.set(p.user_id, { first_name: p.first_name, last_name: p.last_name });
    }

    // For TLs: pick first entry per user (you can improve this later)
    const tlById = new Map<
      string,
      { targetLanguage: string | null; level: "Beginner" | "Intermediate" | "Advanced" }
    >();

    for (const row of friendTLs ?? []) {
      if (tlById.has(row.user_id)) continue;

      const langObj = Array.isArray((row as any)?.lang) ? (row as any).lang[0] : (row as any)?.lang;
      const targetLanguage = langObj?.name ?? null;

      tlById.set(row.user_id, {
        targetLanguage,
        level: (levelToDisplay(row.level) ?? "Beginner"),
      });
    }

    // 4) Combine in the same order as friendEdges (which is sorted by friendship created_at)
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

  return {
    user: userProfile,
    friends,
    chats,
  };
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
        if (!cancelled) {
          setState({ status: "success", data });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatTimeAgo = (dateString?: string | null) => {
    if (!dateString) return "Never";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const content = useMemo(() => {
    if (state.status === "loading" || state.status === "idle") {
      return <SkeletonDashboard />;
    }
    if (state.status === "error") {
      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Couldn’t load dashboard</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
          <button
            className="mt-3 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            onClick={() => location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }

    if (state.status !== "success") {
      return null;
    }

    const { user, friends, chats } = state.data;

    const convoIdByPartner = new Map(chats.map((c) => [c.partnerId, c.id]));

    const friendsForUI = friends;

    return (
      <div className="space-y-6">

        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        </header>

        {/* Profile Card */}
        <Link
          href="/profile"
          className="block rounded-2xl border border-zinc-200 bg-white p-6 hover:bg-zinc-50 transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="relative">
              {user.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-zinc-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-zinc-100 border-2 border-zinc-200 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-zinc-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
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
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold text-zinc-900">
                    Profile
                  </h2>
                  <div className="mt-2 space-y-1">
                    {user.targetLanguage && (
                      <p className="text-sm text-zinc-700">
                        <span className="font-medium">Learning:</span> {user.targetLanguage}
                        {user.level && ` • ${user.level}`}
                      </p>
                    )}
                    {user.nativeLanguage && (
                      <p className="text-sm text-zinc-700">
                        <span className="font-medium">Native:</span> {user.nativeLanguage}
                      </p>
                    )}
                    {!user.targetLanguage && (
                      <p className="text-sm text-zinc-600 italic">Set your target language to get started</p>
                    )}
                  </div>
                </div>
                <div className="shrink-0 text-sm text-zinc-600 flex items-center gap-1">
                  <span>View Profile</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>

        {/* Main content grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Friends section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">Friends</h2>
              <Link
                href="/discover"
                className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
              >
                Find more
              </Link>
            </div>

            <FriendsList
              showHeader={false}
              showSubHeader={false}
              removingIds={removingIds}
              friends={friendsForUI.map((f) => {
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

                // Optimistic UI update
                const prev = state.data;
                setRemovingIds((s) => new Set(s).add(friendId));
                setState({
                  status: "success",
                  data: { ...prev, friends: prev.friends.filter((x) => x.id !== friendId) },
                });

                try {
                  const svc = createFriendService(supabase);
                  await svc.unfriend({ otherUserId: friendId });
                } catch (e) {
                  // Revert if RPC fails
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

          {/* Chats section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">Recent Chats</h2>
              {chats.length > 0 && (
                <Link
                  href="/chats"
                  className="text-sm font-medium text-zinc-700 hover:text-zinc-900"
                >
                  View all
                </Link>
              )}
            </div>

            {chats.length === 0 ? (
              <div className="rounded-2xl border p-6 text-center text-sm text-zinc-600">
                No chats yet.
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-300 bg-white overflow-hidden">
                <ChatLeftPanel
                  linkMode
                  showHeader={false}
                  containerClassName="border-0 bg-transparent"
                  chats={chats.map(c => ({
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
  }, [state]);

  return(
    <>
      <div className="mx-auto w-full p-6">
        {content}
      </div>
    </>

  );
}

function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      <div className="h-10 w-48 animate-pulse rounded-xl bg-zinc-200" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-6 w-24 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded-lg bg-zinc-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      </div>
    </div>
  );
}
