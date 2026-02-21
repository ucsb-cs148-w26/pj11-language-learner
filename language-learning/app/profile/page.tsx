// app/(app)/profile/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

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

async function getUserId(): Promise<string> {
  try {
    const { data, error: authError } = await supabase.auth.getSession();
    if (!authError && data.session?.user) {
      return data.session.user.id;
    }
  } catch {
    // Ignore auth errors in test mode
  }
  // TEST MODE: Use a valid UUID when not authenticated
  return "00000000-0000-0000-0000-000000000000";
}

async function fetchMyProfile(): Promise<Profile> {
  try {
    const userId = await getUserId();

    // Fetch profile data
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("first_name, last_name, bio, native_language, profile_picture_url")
      .eq("user_id", userId)
      .single();

    if (profileError) {
      // If no profile exists, return empty profile
      if (profileError.code === "PGRST116") {
        return {
          firstName: null,
          lastName: null,
          bio: null,
          targetLanguages: [],
          profilePicture: null,
          nativeLanguage: null,
        };
      }
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
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
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
      console.log("Starting account deletion process...");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Could not get user information");
        setDeleteLoading(false);
        return;
      }

      const userId = user.id;

      const { data: rpcData, error: deleteAuthError } = await supabase.rpc(
        "delete_user_account",
        { user_uuid: userId }
      );

      if (deleteAuthError) {
        if (
          deleteAuthError.message?.includes("function") ||
          deleteAuthError.code === "42883" ||
          deleteAuthError.message?.includes("does not exist")
        ) {
          setError(
            "Delete account function not set up. Please run delete_user_account.sql in Supabase SQL Editor, or contact support."
          );
        } else if (deleteAuthError.message?.includes("Not authenticated")) {
          setError("Authentication error. Please try signing out and back in.");
        } else if (deleteAuthError.message?.includes("only delete your own")) {
          setError("Security error: You can only delete your own account.");
        } else {
          setError(
            `Account data deleted, but auth user deletion failed: ${
              deleteAuthError.message || "Unknown error"
            }. Please contact support.`
          );
        }
        await supabase.auth.signOut();
        setDeleteLoading(false);
        router.push("/auth/signin");
        return;
      }

      console.log("✅ Account and all related data deleted successfully!");
      console.log("RPC response:", rpcData);

      await supabase.auth.signOut();
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
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-200" />
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Couldn't load profile</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
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
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Profile</h1>
            <Link
              href="/profile/edit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Edit Profile
            </Link>
          </header>

          {/* Profile Card */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <div className="relative">
                {p.profilePicture ? (
                  <img
                    src={p.profilePicture}
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
                <h2 className="text-xl font-semibold text-zinc-900">
                  {[p.firstName, p.lastName].filter(Boolean).join(" ") || "User"}
                </h2>

                <div className="mt-2 space-y-1">
                  {p.targetLanguages.length > 0 && (
                    <p className="text-sm text-zinc-700">
                      <span className="font-medium">Learning:</span>{" "}
                      {p.targetLanguages
                        .map((t) => `${t.name}${t.level ? ` • ${t.level}` : ""}`)
                        .join(", ")}
                    </p>
                  )}
                  {p.nativeLanguage && (
                    <p className="text-sm text-zinc-700">
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
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Bio</h3>
                <p className="text-sm text-zinc-900 whitespace-pre-wrap">{p.bio}</p>
              </div>
            )}

            {/* Native Language */}
            {p.nativeLanguage && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Native Language</h3>
                <p className="text-sm text-zinc-900">{p.nativeLanguage}</p>
              </div>
            )}

            {/* Target Languages */}
            {p.targetLanguages.length > 0 && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Target Languages</h3>
                <div className="flex flex-wrap gap-2">
                  {p.targetLanguages.map((t) => (
                    <span
                      key={`${t.name}-${t.level ?? "null"}`}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-900"
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
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <h3 className="text-sm font-medium text-zinc-700 mb-4">Account Actions</h3>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={signOutLoading || deleteLoading}
                  className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {signOutLoading ? "Signing out..." : "Sign Out"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={signOutLoading || deleteLoading}
                  className="flex-1 rounded-xl border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-zinc-900 mb-2">Delete Account</h3>
            <p className="text-sm text-zinc-700 mb-6">
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
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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