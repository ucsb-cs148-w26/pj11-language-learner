// app/profile/[userId]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { createFriendService } from "@/utils/friends/friendService";
import type { RelationshipStatus } from "@/utils/friends/friendTypes";

// Helper function to convert database level to display format
function levelToDisplay(
  level: string | null | undefined
): "Beginner" | "Intermediate" | "Advanced" | null {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

type TargetLanguage = {
  name: string;
  level: "Beginner" | "Intermediate" | "Advanced" | null;
};

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  targetLanguages: TargetLanguage[]; // ✅ multiple
  profilePicture?: string | null;
  nativeLanguage?: string | null;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function getUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (!authError && user) return user.id;
  } catch {
    // ignore auth errors
  }
  return null;
}

async function fetchUserProfile(userId: string): Promise<Profile> {
  // Fetch profile data
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, bio, native_language, profile_picture_url")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    if (profileError.code === "PGRST116") throw new Error("Profile not found");
    const errorMessage =
      profileError.message || `Supabase error: ${profileError.code || "Unknown"}`;
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = profileError.code;
    (enhancedError as any).details = profileError.details;
    throw enhancedError;
  }

  // Fetch ALL target languages
  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from("profile_target_languages")
    .select("level, languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId);

  if (targetLanguagesError) {
    const errorMessage =
      targetLanguagesError.message ||
      `Supabase error: ${targetLanguagesError.code || "Unknown"}`;
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = targetLanguagesError.code;
    (enhancedError as any).details = targetLanguagesError.details;
    throw enhancedError;
  }

  const targetLanguages: TargetLanguage[] = (targetLanguagesData ?? [])
    .map((row: any) => {
      const name = row?.languages?.name ?? null;
      if (!name) return null;
      return {
        name,
        level: levelToDisplay(row.level),
      };
    })
    .filter(Boolean) as TargetLanguage[];

  return {
    firstName: profileData.first_name,
    lastName: profileData.last_name,
    bio: profileData.bio,
    targetLanguages,
    profilePicture: profileData.profile_picture_url,
    nativeLanguage: profileData.native_language,
  };
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
        const vid = await getUserId();
        if (cancelled) return;
        setViewerId(vid);

        if (!vid) {
          setRelStatus(null);
          return;
        }
        if (vid === userId) {
          setRelStatus({ kind: "self" });
          return;
        }

        const friends = createFriendService(supabase);
        const status = await friends.getRelationshipStatus({
          viewerId: vid,
          otherUserId: userId,
        });
        if (!cancelled) setRelStatus(status);
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
    if (!viewerId || viewerId === userId) {
      setRelStatus(viewerId === userId ? { kind: "self" } : null);
      return;
    }
    const friends = createFriendService(supabase);
    const status = await friends.getRelationshipStatus({
      viewerId,
      otherUserId: userId,
    });
    setRelStatus(status);
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
    const friends = createFriendService(supabase);
    await withAction("send", () =>
      friends.sendFriendRequest({ requesterId: viewerId, recipientId: userId })
    );
  }

  async function handleAccept(requestId?: string) {
    if (!viewerId || !requestId) return;
    const friends = createFriendService(supabase);
    await withAction("accept", async () => {
      const conversationId = await friends.acceptFriendRequest({ requestId });
      router.push(`/chats?c=${encodeURIComponent(conversationId)}`);
    });
  }

  async function handleDeny(requestId?: string) {
    if (!viewerId || !requestId) return;
    const friends = createFriendService(supabase);
    await withAction("deny", () => friends.denyFriendRequest({ requestId }));
  }

  async function handleCancel(requestId?: string) {
    if (!viewerId || !requestId) return;
    const friends = createFriendService(supabase);
    await withAction("cancel", () => friends.cancelFriendRequest({ requestId }));
  }

  async function handleUnfriend() {
    if (!viewerId) return;
    const friends = createFriendService(supabase);
    await withAction("unfriend", () => friends.unfriend({ otherUserId: userId }));
  }

  async function handleMessage() {
    if (relStatus?.kind !== "friends") return;
    try {
      setMessaging(true);
      setError(null);

      const { data, error } = await supabase.rpc("start_conversation_no_dupe", {
        partner_id: userId,
      });

      if (error) throw error;

      const conversationId = data as string;
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
              {p.profilePicture ? (
                <img
                  src={p.profilePicture}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-border-soft"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-soft-2 border-2 border-gray-border-soft flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-muted"
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
