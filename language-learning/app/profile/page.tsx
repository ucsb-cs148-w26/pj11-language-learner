// app/(app)/profile/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

async function fetchMyProfile(): Promise<Profile> {
  try {
    const res = await fetch("/api/profile/me");
    const body = await res.json();
    if (!res.ok) {
      throw new Error(body?.error || "Failed to load profile");
    }
    return body.profile as Profile;
  } catch (e) {
    if (e instanceof Error && (e.name === "AbortError" || e.message.includes("aborted"))) {
      throw new Error("Network request was cancelled. Please check your connection and try again.");
    }
    throw e;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState<Profile>>({ status: "loading" });
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyProfile();
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
  }, []);

  async function handleSignOut() {
    setSignOutLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/signout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error || "Sign out failed");
        setSignOutLoading(false);
        return;
      }
      router.push("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setSignOutLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/delete", { method: "POST" });
      const body = await res.json();

      if (!res.ok) {
        const errMsg = String(body?.error || "Account deletion failed");
        const errCode = String(body?.code || "");
        if (errMsg.includes("function") || errCode === "42883" || errMsg.includes("does not exist")) {
          setError(
            "Delete account function not set up. Please run delete_user_account.sql in Supabase SQL Editor, or contact support."
          );
        } else if (errMsg.includes("Not authenticated")) {
          setError("Authentication error. Please try signing out and back in.");
        } else if (errMsg.includes("only delete your own")) {
          setError("Security error: You can only delete your own account.");
        } else {
          setError(
            `Account data deleted, but auth user deletion failed: ${errMsg}. Please contact support.`
          );
        }
        setDeleteLoading(false);
        router.push("/auth/signin");
        return;
      }

      router.push("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "An unexpected error occurred";
      setError(msg);
      setDeleteLoading(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-gray-border-soft" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-gray-border-soft" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
          <p className="font-medium text-dark-red">Couldn't load profile</p>
          <p className="mt-1 text-sm text-dark-red">{state.message}</p>
        </div>
      </div>
    );
  }

  const p = state.data;

  return (
    <>
      <div className="mx-auto max-w-6xl w-full p-6">
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-gray-text">Profile</h1>
            <Link
              href="/profile/edit"
              className="rounded-xl bg-gray-text px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Edit Profile
            </Link>
          </header>

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

          {/* Account Actions */}
          <section className="space-y-4">
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <h3 className="text-sm font-medium text-gray-muted mb-4">Account Actions</h3>

              {error && (
                <div className="mb-4 rounded-xl border border-dark-red/20 bg-light-red p-4">
                  <p className="text-sm text-dark-red">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signOutLoading || deleteLoading}
                  className="flex-1 rounded-xl border border-gray-border bg-white px-4 py-2 text-sm font-medium text-gray-text hover:bg-off-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {signOutLoading ? "Signing out..." : "Sign Out"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={signOutLoading || deleteLoading}
                  className="flex-1 rounded-xl border border-dark-red/30 bg-white px-4 py-2 text-sm font-medium text-dark-red hover:bg-light-red disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-border-soft p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-text mb-2">Delete Account</h3>
            <p className="text-sm text-gray-muted mb-6">
              Are you sure you want to delete your account? This action cannot be undone. All your
              profile data, conversations, and connections will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setError(null);
                }}
                disabled={deleteLoading}
                className="flex-1 rounded-xl border border-gray-border bg-white px-4 py-2 text-sm font-medium text-gray-text hover:bg-off-white disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-dark-red px-4 py-2 text-sm font-medium text-white hover:bg-dark-red-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                {deleteLoading ? "Deleting..." : "Delete Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}