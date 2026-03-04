"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FriendRequests, {
  type IncomingRequestItem,
  type OutgoingRequestItem,
} from "@/components/friends/requests";
import FriendsList from "@/components/friends/list";

type RequestsPayload = {
  incomingRequests: IncomingRequestItem[];
  outgoingRequests: OutgoingRequestItem[];
};

type DashboardData = {
  user: {
    targetLanguages: Array<{
      name: string;
      level: "Beginner" | "Intermediate" | "Advanced" | null;
    }>;
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

type PageData = {
  requests: RequestsPayload;
  dashboard: DashboardData;
};

type LoadState =
  | { status: "idle" | "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: PageData };

async function fetchRequests(): Promise<RequestsPayload> {
  const res = await fetch("/api/requests");
  const body = await res.json();

  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view requests.");
    throw new Error(body?.error || "Failed to load requests");
  }

  return body as RequestsPayload;
}

async function fetchDashboard(): Promise<DashboardData> {
  const res = await fetch("/api/dashboard");
  const body = await res.json();

  if (!res.ok) {
    if (res.status === 401) throw new Error("Please sign in to view requests.");
    throw new Error(body?.error || "Failed to load dashboard");
  }

  return body as DashboardData;
}

async function postJson<T = any>(url: string, payload: Record<string, unknown>): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(body?.error || "Request failed");
  }

  return body as T;
}

export default function RequestsPage() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setState({ status: "loading" });
      try {
        const [requests, dashboard] = await Promise.all([fetchRequests(), fetchDashboard()]);
        if (!cancelled) {
          setState({
            status: "success",
            data: { requests, dashboard },
          });
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load page";
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === "idle" || state.status === "loading") {
    return (
      <div className="mx-auto w-full p-6 text-gray-text">
        <div className="rounded-2xl border border-gray-border bg-white p-6 text-center">
          <p className="text-sm text-gray-muted">Loading...</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto w-full p-6 text-gray-text">
        <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
          <p className="font-medium text-dark-red">Couldn’t load requests page</p>
          <p className="mt-1 text-sm text-dark-red">{state.message}</p>
          <button
            className="mt-3 rounded-xl bg-dark-red px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            onClick={() => location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  if (state.status !== "success") return null;

  const { requests, dashboard } = state.data;
  const convoIdByPartner = new Map(dashboard.chats.map((c) => [c.partnerId, c.id]));

  return (
    <div className="mx-auto w-full p-6 text-gray-text">

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left: Requests */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-text">Requests</h2>
          </div>

          <FriendRequests
            incomingRequests={requests.incomingRequests}
            outgoingRequests={requests.outgoingRequests}
            showHeader = {false}
            onAccept={async (requestId) => {
              const body = await postJson<{ conversationId: string }>("/api/requests/accept", { requestId });
              return { conversationId: body.conversationId };
            }}
            onDeny={async (requestId) => {
              await postJson("/api/requests/deny", { requestId });
            }}
            onCancel={async (requestId) => {
              await postJson("/api/requests/cancel", { requestId });
            }}
          />
        </section>

        {/* Right: Friends */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-text">Friends</h2>
            <Link href="/discover" className="text-sm font-medium text-gray-muted hover:text-gray-text">
              Find More
            </Link>
          </div>

          <FriendsList
            showHeader={false}
            showSubHeader
            removingIds={removingIds}
            friends={dashboard.friends.map((f) => {
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

              // optimistic update (friends side only)
              setRemovingIds((s) => new Set(s).add(friendId));
              setState({
                status: "success",
                data: {
                  ...prev,
                  dashboard: {
                    ...prev.dashboard,
                    friends: prev.dashboard.friends.filter((x) => x.id !== friendId),
                  },
                },
              });

              try {
                const res = await fetch("/api/friends/unfriend", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ otherUserId: friendId }),
                });
                const body = await res.json();
                if (!res.ok) throw new Error(body?.error || "Failed to remove friend");

                // refresh dashboard side so chats/friends stay in sync
                const freshDashboard = await fetchDashboard();
                setState((curr) => {
                  if (curr.status !== "success") return curr;
                  return {
                    status: "success",
                    data: {
                      ...curr.data,
                      dashboard: freshDashboard,
                    },
                  };
                });
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
      </div>
    </div>
  );
}