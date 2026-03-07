"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FriendsList from "@/components/friends/list";
import ChatLeftPanel from "@/components/chat/ChatLeftPanel";
import Avatar from "@/components/Avatar";

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
    partnerAvatarUrl: string | null;
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

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Failed to load dashboard");
  return body as DashboardData;
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
            <Avatar
              src={user.profilePicture}
              alt="Profile"
              size="w-20 h-20"
              iconSize="w-10 h-10"
              imgClassName="border-2 border-gray-border-soft"
            />
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
                  avatarUrl: f.avatarUrl ?? null,
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
                  const res = await fetch("/api/friends/unfriend", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ otherUserId: friendId }),
                  });
                  const body = await res.json();
                  if (!res.ok) throw new Error(body?.error || "Failed to remove friend");

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
              <div className="rounded-2xl border border-gray-border bg-white p-6 text-center text-sm text-gray-muted">No chats yet.</div>
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
                    partnerAvatarUrl: c.partnerAvatarUrl,
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