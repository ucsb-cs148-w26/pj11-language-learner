// app/profile/[userId]/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Helper function to convert database level to display format
function levelToDisplay(level: string | null | undefined): "Beginner" | "Intermediate" | "Advanced" | null {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

type Profile = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  targetLanguage?: string | null;
  level?: "Beginner" | "Intermediate" | "Advanced" | null;
  profilePicture?: string | null;
  nativeLanguage?: string | null;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function getUserId(): Promise<string | null> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user) {
      return user.id;
    }
  } catch (e) {
    // Ignore auth errors
  }
  return null;
}

async function fetchUserProfile(userId: string): Promise<Profile> {
  // Fetch profile data
  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('first_name, last_name, bio, native_language, profile_picture_url')
    .eq('user_id', userId)
    .single();

  if (profileError) {
    // If no profile exists, throw error
    if (profileError.code === 'PGRST116') {
      throw new Error("Profile not found");
    }
    const errorMessage = profileError.message || `Supabase error: ${profileError.code || 'Unknown'}`;
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = profileError.code;
    (enhancedError as any).details = profileError.details;
    throw enhancedError;
  }

  // Fetch target languages from separate table
  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from('profile_target_languages')
    .select('level, languages(name)')
    .eq('user_id', userId)
    .limit(1);

  // Get first target language (or null if none)
  const firstTL =
    targetLanguagesData && targetLanguagesData.length > 0 ? targetLanguagesData[0] : null;

  const targetLanguage = (firstTL as any)?.languages?.name ?? null;
  const level = levelToDisplay(firstTL?.level ?? null);

  return {
    firstName: profileData.first_name,
    lastName: profileData.last_name,
    bio: profileData.bio,
    targetLanguage: targetLanguage,
    level: level,
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

  useEffect(() => {
    if (!userId) return;
    
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserProfile(userId);
        if (!cancelled) {
          setState({ status: "success", data });
        }
      } catch (e) {
        let msg = "Unknown error";
        if (e instanceof Error) {
          if (e.name === 'AbortError' || e.message.includes('aborted')) {
            msg = "Request was cancelled. Please refresh the page.";
          } else {
            msg = e.message;
          }
        } else if (e && typeof e === 'object' && 'message' in e) {
          msg = String(e.message);
        } else if (e && typeof e === 'object' && 'code' in e) {
          msg = `Error code: ${e.code}`;
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

  async function handleMessage() {
    try {
      setMessaging(true);
      setError(null);

      const { data, error } = await supabase.rpc("start_conversation_no_dupe", {
        partner_id: userId,
      });

      if (error) throw error;

      const conversationId = data as string;

      // Navigate to chats and auto-select that conversation
      router.push(`/chats?c=${encodeURIComponent(conversationId)}`);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Could not start conversation. Check console for details.";
      setError(msg);
      setMessaging(false);
    }
  }

  if (state.status === "loading") {
    return (
      <div className="min-h-screen bg-white w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="h-10 w-1/2 animate-pulse rounded-xl bg-zinc-200" />
          <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-200" />
        </main>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="min-h-screen bg-white w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="font-medium text-red-800">Couldn't load profile</p>
            <p className="mt-1 text-sm text-red-700">{state.message}</p>
            <Link
              href="/discover"
              className="mt-4 inline-block rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Back to Discover
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const p = state.data;

  return (
    <div className="min-h-screen bg-white w-full">
      <main className="mx-auto max-w-6xl p-6">
        <div className="space-y-6">
          <header className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Profile</h1>
            <button
              onClick={handleMessage}
              disabled={messaging}
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {messaging ? "Starting conversation..." : "Message"}
            </button>
          </header>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

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
                  {p.targetLanguage && (
                    <p className="text-sm text-zinc-700">
                      <span className="font-medium">Learning:</span> {p.targetLanguage}
                      {p.level && ` • ${p.level}`}
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

            {/* Target Language */}
            {p.targetLanguage && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Target Language</h3>
                <p className="text-sm text-zinc-900">{p.targetLanguage}</p>
              </div>
            )}

            {/* Level */}
            {p.level && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-700 mb-2">Proficiency Level</h3>
                <p className="text-sm text-zinc-900">{p.level}</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
