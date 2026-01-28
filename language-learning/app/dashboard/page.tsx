// app/(app)/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user) {
      return user.id;
    }
  } catch (e) {
    // Ignore auth errors in test mode
  }
  // TEST MODE: Use a test user ID when not authenticated
  return "test-user-id";
}

async function fetchDashboard(): Promise<DashboardData> {
  const userId = await getUserId();

  // Fetch user profile
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('level, native_language')
    .eq('user_id', userId)
    .single();

  if (profileError && profileError.code !== 'PGRST116') {
    throw profileError;
  }

  // Fetch target languages from separate table
  const { data: targetLanguagesData } = await supabase
    .from('profile_target_languages')
    .select('language')
    .eq('user_id', userId);

  // Get first target language (or null if none)
  const targetLanguage = targetLanguagesData && targetLanguagesData.length > 0 
    ? targetLanguagesData[0].language 
    : null;

  const userProfile = profileData ? {
    targetLanguage: targetLanguage,
    profilePicture: null, // profile_picture column doesn't exist in table
    level: profileData.level,
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

    return (
      <div className="space-y-6">
        {/* Header */}
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

            <div className="rounded-2xl border border-zinc-200 bg-white">
              {friends.length === 0 ? (
                <div className="p-6 text-center">
                  <p className="text-sm text-zinc-700">No friends yet.</p>
                  <Link
                    href="/discover"
                    className="mt-3 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    Find partners
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {friends.map((friend: DashboardData["friends"][0]) => (
                    <div
                      key={friend.id}
                      className="p-4 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-zinc-900">{friend.name}</p>
                          <p className="mt-1 text-sm text-zinc-700">
                            {friend.targetLanguage} • {friend.level}
                          </p>
                        </div>
                        <Link
                          href={`/chat/${friend.id}`}
                          className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                        >
                          Chat
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

  return (
    <div className="min-h-screen bg-white w-full">
      <main className="mx-auto max-w-6xl p-6">{content}</main>
    </div>
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
