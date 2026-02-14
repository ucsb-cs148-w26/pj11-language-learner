// app/(app)/dashboard/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import FriendsList from "@/components/friends/list";

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
    unreadCount: number;
  }>;
};

type LoadState<T> =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function getUserId(): Promise<string> {
  try {
    // First check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      return session.user.id;
    }
    
    // If no session, try to get user (this will refresh if needed)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user) {
      return user.id;
    }
  } catch (e) {
    console.error("Error getting user ID:", e);
    // Ignore auth errors in test mode
  }
  // TEST MODE: Use a test user ID when not authenticated
  return "test-user-id";
}

async function fetchDashboard(): Promise<DashboardData> {
  const userId = await getUserId();
  
  // If using test user ID, return empty data instead of querying
  if (userId === "test-user-id") {
    return {
      user: {
        targetLanguage: null,
        profilePicture: null,
        level: null,
        nativeLanguage: null,
      },
      friends: [],
      chats: [],
    };
  }

  // Fetch user profile
  console.log("Fetching profile for userId:", userId);
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
  
  console.log("Profile data:", profileData);

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

  // TODO: Fetch friends and chats when those tables are set up
  // For now, return empty arrays
  return {
    user: userProfile,
    friends: [],
    chats: [],
  };
}

export default function DashboardPage() {
  const [state, setState] = useState<LoadState<DashboardData>>({ status: "idle" });

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

    const friendsForUI =
      friends.length > 0
        ? friends
        : [
          // { id: "b73dc898-2c56-464d-a43f-6bc5b804f09c", name: "Natalie Forte", targetLanguage: "Spanish", level: "Advanced" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
          // { id: "15da3404-ee03-4203-b186-f9561e12d304", name: "Abhiram A", targetLanguage: "Japanese", level: "Beginner" as const },
        ]; // TO DO: Placeholder for dummy friends. User real data later.

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
              friends={friendsForUI.map((f) => ({
                id: f.id,
                name: f.name,
                profileHref: `/profile/${f.id}`,
                chatHref: "/chats",
              }))}
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

            <div className="rounded-2xl border border-zinc-200 bg-white">
              {chats.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-zinc-700">No chats yet.</p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Start a conversation with a friend!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {chats.map((chat: DashboardData["chats"][0]) => (
                    <Link
                      key={chat.id}
                      href={`/chat/${chat.partnerId}`}
                      className="block p-4 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-900">{chat.partnerName}</p>
                            {chat.unreadCount > 0 && (
                              <span className="rounded-full bg-zinc-900 text-white text-xs font-medium px-2 py-0.5">
                                {chat.unreadCount}
                              </span>
                            )}
                          </div>
                            {chat.lastMessage && (
                              <p className="mt-1 text-sm text-zinc-700 truncate">
                                {chat.lastMessage}
                              </p>
                            )}
                            {chat.lastMessageAt && (
                              <p className="mt-1 text-xs text-zinc-600">
                                {formatTimeAgo(chat.lastMessageAt)}
                              </p>
                            )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
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
