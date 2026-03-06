// app/profile/[userId]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import type { RelationshipStatus } from "@/utils/friends/friendTypes";
import Avatar from "@/components/Avatar";

type TargetLanguage = {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
};

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  targetLanguages: TargetLanguage[];
  profilePicture?: string | null;
  nativeLanguage?: string | null;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function fetchUserProfile(userId: string): Promise<Profile> {
  const res = await fetch(`/api/profile/${encodeURIComponent(userId)}`);
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body?.error || "Profile not found");
  }
  return body.profile as Profile;
}

export default function UserProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [state, setState] = useState<LoadState<Profile>>({ status: "loading" });
  const [messaging, setMessaging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [relStatus, setRelStatus] = useState<RelationshipStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<
    "send" | "accept" | "deny" | "cancel" | "unfriend" | null
  >(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserProfile(userId);
        if (!cancelled) setState({ status: "success", data });
      } catch (e) {
        let msg = "Unknown error";
        if (e instanceof Error) {
          if (e.name === "AbortError" || e.message.includes("aborted")) {
            msg = "Request was cancelled. Please refresh the page.";
          } else {
            msg = e.message;
          }
        } else if (e && typeof e === "object" && "message" in e) {
          msg = String((e as any).message);
        } else if (e && typeof e === "object" && "code" in e) {
          msg = `Error code: ${(e as any).code}`;
        } else {
          msg = `Error: ${JSON.stringify(e)}`;
        }
        console.error("Profile fetch error:", e);
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;

    (async () => {
      setStatusLoading(true);
      try {
        const res = await fetch(`/api/friends/status?targetUserId=${encodeURIComponent(userId)}`);
        const body = await res.json();
        if (cancelled) return;

        setViewerId(body?.viewerId ?? null);
        setRelStatus(body?.status ?? null);
      } catch (e) {
        if (!cancelled) {
          console.error("Relationship status error:", e);
          setRelStatus(null);
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const refreshStatus = async () => {
    try {
      const res = await fetch(`/api/friends/status?targetUserId=${encodeURIComponent(userId)}`);
      const body = await res.json();
      setViewerId(body?.viewerId ?? null);
      setRelStatus(body?.status ?? null);
    } catch (e) {
      console.error("Relationship status error:", e);
      setRelStatus(null);
    }
  };

  const withAction = async (
    label: "send" | "accept" | "deny" | "cancel" | "unfriend",
    fn: () => Promise<unknown>
  ) => {
    setActionLoading(label);
    setActionError(null);
    try {
      await fn();
      await refreshStatus();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Action failed";
      setActionError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  async function handleSendRequest() {
    if (!viewerId) {
      setActionError("Please sign in to send friend requests.");
      return;
    }
    await withAction("send", async () => {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action: "send" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to send request");
    });
  }

  async function handleAccept(requestId?: string) {
    if (!viewerId || !requestId) return;
    await withAction("accept", async () => {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action: "accept", request_id: requestId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to accept request");
      if (body?.conversationId) {
        router.push(`/chats?c=${encodeURIComponent(body.conversationId)}`);
      }
    });
  }

  async function handleDeny(requestId?: string) {
    if (!viewerId || !requestId) return;
    await withAction("deny", async () => {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action: "deny", request_id: requestId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to deny request");
    });
  }

  async function handleCancel(requestId?: string) {
    if (!viewerId || !requestId) return;
    await withAction("cancel", async () => {
      const res = await fetch("/api/friends/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, action: "cancel", request_id: requestId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to cancel request");
    });
  }

  async function handleUnfriend() {
    if (!viewerId) return;
    await withAction("unfriend", async () => {
      const res = await fetch("/api/friends/unfriend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to unfriend");
    });
  }

  async function handleMessage() {
    if (relStatus?.kind !== "friends") return;
    try {
      setMessaging(true);
      setError(null);

      const res = await fetch("/api/profile/start-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ partnerId: userId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to start conversation");

      const conversationId = body.conversationId as string;
      router.push(`/chats?c=${encodeURIComponent(conversationId)}`);
    } catch (e) {
      console.error(e);
      const msg =
        e instanceof Error
          ? e.message
          : "Could not start conversation. Check console for details.";
      setError(msg);
      setMessaging(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-background w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="h-10 w-1/2 animate-pulse rounded-xl bg-gray-border-soft" />
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-gray-border-soft" />
        </main>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-background w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
            <p className="font-medium text-dark-red">Couldn't load profile</p>
            <p className="mt-1 text-sm text-dark-red">{state.message}</p>
            <Link
              href="/discover"
              className="mt-4 inline-block rounded-xl bg-gray-text px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const p = state.data;

  const renderFriendButton = () => {
    if (statusLoading) {
      return (
        <button
          className="rounded-xl border border-gray-border-soft px-4 py-2 text-sm text-gray-muted bg-white"
          disabled
        >
          Loading...
        </button>
      );
    }

    if (!viewerId) {
      return (
        <Link
          href="/auth/signin"
          className="rounded-xl border border-gray-border-soft px-4 py-2 text-sm font-medium text-gray-text hover:bg-off-white"
        >
          Sign in to connect
        </Link>
      );
    }

    if (relStatus?.kind === "self") return null;
    if (!relStatus) return null;

    const commonClasses =
      "rounded-xl px-4 py-2 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

    switch (relStatus.kind) {
      case "none":
        return (
          <button
            onClick={handleSendRequest}
            disabled={actionLoading === "send"}
            className={`${commonClasses} bg-gray-text text-white hover:opacity-90`}
          >
            {actionLoading === "send" ? "Sending..." : "Send friend request"}
          </button>
        );
      case "incoming_request": {
        const reqId = relStatus.request.id;
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleAccept(reqId)}
              disabled={actionLoading === "accept"}
              className={`${commonClasses} bg-gray-text text-white hover:opacity-90`}
            >
              {actionLoading === "accept" ? "Accepting..." : "Accept"}
            </button>
            <button
              onClick={() => handleDeny(reqId)}
              disabled={actionLoading === "deny"}
              className={`${commonClasses} border border-gray-border bg-white text-gray-text hover:bg-off-white`}
            >
              {actionLoading === "deny" ? "Denying..." : "Deny"}
            </button>
          </div>
        );
      }
      case "outgoing_request": {
        const reqId = relStatus.request.id;
        return (
          <button
            onClick={() => handleCancel(reqId)}
            disabled={actionLoading === "cancel"}
            className={`${commonClasses} border border-gray-border bg-white text-gray-text hover:bg-off-white`}
          >
            {actionLoading === "cancel" ? "Canceling..." : "Cancel request"}
          </button>
        );
      }
      case "friends":
        return (
          <button
            onClick={handleUnfriend}
            disabled={actionLoading === "unfriend"}
            className={`${commonClasses} border border-gray-border bg-white text-gray-text hover:bg-off-white`}
          >
            {actionLoading === "unfriend" ? "Unfriending..." : "Unfriend"}
          </button>
        );
      default:
        return null;
    }
  };

  return (
      <div className="mx-auto max-w-6xl w-full p-6">
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-text">Profile</h1>
            <div className="flex items-center gap-3">
              {renderFriendButton()}
              {relStatus?.kind === "friends" && (
                <button
                  onClick={handleMessage}
                  disabled={messaging}
                  className="rounded-xl bg-gray-text px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {messaging ? "Starting..." : "Message"}
                </button>
              )}
            </div>
          </header>

          {error && (
            <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
              <p className="text-sm text-dark-red">{error}</p>
            </div>
          )}
          {actionError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-900">{actionError}</p>
            </div>
          )}

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar
                src={p.profilePicture}
                alt="Profile"
                size="w-20 h-20"
                iconSize="w-10 h-10"
                imgClassName="border-2 border-gray-border-soft"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-gray-text">
                {[p.firstName, p.lastName].filter(Boolean).join(" ") || "User"}
              </h2>

              <div className="mt-2 space-y-1">
                {p.targetLanguages.length > 0 && (
                  <p className="text-sm text-gray-muted">
                    <span className="font-medium">Learning:</span>{" "}
                    {p.targetLanguages
                      .map((t) => `${t.name}${t.level ? ` • ${t.level}` : ""}`)
                      .join(", ")}
                  </p>
                )}

                {p.nativeLanguage && (
                  <p className="text-sm text-gray-muted">
                    <span className="font-medium">Native:</span> {p.nativeLanguage}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <section className="space-y-4">
          {/* Bio */}
          {p.bio && (
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <h3 className="text-sm font-medium text-gray-muted mb-2">Bio</h3>
              <p className="text-sm text-gray-text whitespace-pre-wrap">{p.bio}</p>
            </div>
          )}

          {/* Native Language */}
          {p.nativeLanguage && (
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <h3 className="text-sm font-medium text-gray-muted mb-2">Native Language</h3>
              <p className="text-sm text-gray-text">{p.nativeLanguage}</p>
            </div>
          )}

          {/* Target Languages */}
          {p.targetLanguages.length > 0 && (
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <h3 className="text-sm font-medium text-gray-muted mb-2">Target Languages</h3>
              <div className="flex flex-wrap gap-2">
                {p.targetLanguages.map((t) => (
                  <span
                    key={`${t.name}-${t.level ?? "null"}`}
                    className="rounded-full border border-gray-border-soft bg-off-white px-3 py-1 text-sm text-gray-text"
                  >
                    {t.name}
                    {t.level ? ` · ${t.level}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
