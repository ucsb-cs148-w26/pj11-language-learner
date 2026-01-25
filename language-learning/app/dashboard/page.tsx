// app/(app)/dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type DashboardData = {
  user: {
    displayName?: string | null;
    targetLanguage?: string | null;
    profilePhotoUrl?: string | null;
    level?: "Beginner" | "Intermediate" | "Advanced" | null;
    nativeLanguages?: string[] | null;
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

async function fetchDashboard(): Promise<DashboardData> {
  // TODO: Replace with Supabase calls when API is ready
  // Example Supabase calls:
  // const { data: user } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
  // const { data: friends } = await supabase.from('friendships').select('...').eq('user_id', userId);
  // const { data: chats } = await supabase.from('chats').select('...').eq('user_id', userId);
  // return { user, friends, chats };
  
  try {
    const res = await fetch("/api/dashboard", { method: "GET" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as DashboardData;
  } catch {
    // Mock fallback for frontend-only dev
    // Remove this when Supabase is connected
    return {
      user: {
        displayName: null,
        targetLanguage: null,
        profilePhotoUrl: null,
        level: null,
        nativeLanguages: ["English"],
      },
      friends: [
        {
          id: "f1",
          name: "Alex",
          targetLanguage: "Japanese",
          level: "Beginner",
          lastActive: new Date().toISOString(),
        },
        {
          id: "f2",
          name: "Mina",
          targetLanguage: "Japanese",
          level: "Intermediate",
          lastActive: new Date(Date.now() - 86400000).toISOString(),
        },
      ],
      chats: [
        {
          id: "c1",
          partnerId: "f1",
          partnerName: "Alex",
          lastMessage: "Hey! How's your practice going?",
          lastMessageAt: new Date().toISOString(),
          unreadCount: 2,
        },
        {
          id: "c2",
          partnerId: "f2",
          partnerName: "Mina",
          lastMessage: "Thanks for the conversation yesterday!",
          lastMessageAt: new Date(Date.now() - 3600000).toISOString(),
          unreadCount: 0,
        },
      ],
    };
  }
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
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
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
                    {user.displayName || "Your Name"}
                  </h2>
                  <div className="mt-2 space-y-1">
                    {user.targetLanguage && (
                      <p className="text-sm text-zinc-700">
                        <span className="font-medium">Learning:</span> {user.targetLanguage}
                        {user.level && ` • ${user.level}`}
                      </p>
                    )}
                    {user.nativeLanguages && user.nativeLanguages.length > 0 && (
                      <p className="text-sm text-zinc-700">
                        <span className="font-medium">Native:</span> {user.nativeLanguages.join(", ")}
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

  return <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">{content}</main>;
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
