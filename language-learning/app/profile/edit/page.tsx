// app/(app)/profile/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Database stores lowercase values
type LevelDB = "beginner" | "intermediate" | "advanced";
// UI displays capitalized values
type LevelDisplay = "Beginner" | "Intermediate" | "Advanced";

// Helper functions to convert between database and display formats
function levelToDisplay(level: LevelDB | null | undefined): LevelDisplay {
  if (!level) return "Beginner";
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

function levelToDB(level: LevelDisplay): LevelDB {
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "intermediate";
  if (lower === "advanced") return "advanced";
  return "beginner";
}

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  targetLanguage: string;
  nativeLanguage: string;
  level: LevelDisplay; // Form uses display format
};

type ProfileAPI = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  targetLanguage: string;
  nativeLanguage?: string | null;
  level: LevelDB; // API uses database format
};

type ProfileDisplay = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  targetLanguage: string;
  nativeLanguage?: string | null;
  level: LevelDisplay; // Display format
};

type LanguageOption = {
  id: number;
  name: string;
};

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

async function fetchLanguages(): Promise<LanguageOption[]> {
  const { data, error } = await supabase
    .from("languages")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LanguageOption[];
}

async function fetchMyProfile(): Promise<ProfileDisplay> {
  const userId = await getUserId();
  console.log("Fetching profile for user:", userId);

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, bio, native_language")
    .eq("user_id", userId)
    .single();

  console.log("Profile fetch result:", { profileData, profileError });

  if (profileError) {
    // If no profile exists, return empty profile
    if (profileError.code === 'PGRST116') {
      console.log("No profile found, returning empty profile");
      return {
        firstName: "",
        lastName: "",
        bio: "",
        targetLanguage: "",
        nativeLanguage: "",
        level: "Beginner", // Display format
      };
    }
    console.error("Profile fetch error:", profileError);
    throw profileError;
  }

  // Fetch target languages from separate table
  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from("profile_target_languages")
    .select("level, languages(name)")
    .eq("user_id", userId)
    .limit(1);

  console.log("Target languages fetch result:", { targetLanguagesData, targetLanguagesError });
  if (targetLanguagesError) console.error("Target languages fetch error:", targetLanguagesError);

  const firstTL =
    targetLanguagesData && targetLanguagesData.length > 0 ? targetLanguagesData[0] : null;

  const targetLanguage = (firstTL as any)?.languages?.name ?? "";
  const levelDB = (firstTL?.level as LevelDB | null) ?? null;

  const result: ProfileDisplay = {
    firstName: profileData.first_name || "",
    lastName: profileData.last_name || "",
    bio: profileData.bio || "",
    targetLanguage: targetLanguage,
    nativeLanguage: profileData.native_language || "",
    level: levelToDisplay(levelDB),
  };

  console.log("Returning profile data:", result);
  return result;
}

async function saveMyProfile(payload: ProfileAPI): Promise<void> {
  const userId = await getUserId();

  // Get existing profile to preserve email, or get email from auth user
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("user_id", userId)
    .single();

  let email: string | null = existingProfile?.email || null;
  if (!email) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      email = user?.email || null;
    } catch (e) {
      // If we can't get email from auth, use a placeholder for test-user-id
      if (userId === "test-user-id") {
        email = "test@example.com";
      }
    }
  }

  // Update profile in profiles table
  console.log("Saving profile with level:", payload.level);
  console.log("Full payload:", payload);
  
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        email: email,
        first_name: payload.firstName?.trim() || null,
        last_name: payload.lastName?.trim() || null,
        bio: payload.bio || null,
        native_language: payload.nativeLanguage?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (profileError) throw profileError;

  const langName = payload.targetLanguage.trim();
  if (langName) {
    const { data: langRow, error: langSelectError } = await supabase
      .from("languages")
      .select("id")
      .eq("name", langName)
      .maybeSingle();

    if (langSelectError) throw langSelectError;
    if (!langRow?.id) {
      throw new Error(`Selected language "${langName}" not found in languages table.`);
    }

    const languageId = langRow.id;

    const { error: delErr } = await supabase
      .from("profile_target_languages")
      .delete()
      .eq("user_id", userId);

    if (delErr) throw delErr;

    const { error: insErr } = await supabase
      .from("profile_target_languages")
      .insert({
        user_id: userId,
        language_id: languageId,
        level: payload.level,
      });

    if (insErr) throw insErr;
  }
}


export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    bio: "",
    targetLanguage: "",
    nativeLanguage: "",
    level: "Beginner", // Display format
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const [p, langs] = await Promise.all([fetchMyProfile(), fetchLanguages()]);

        if (cancelled) return;

        setLanguages(langs);

        const hasTarget = p.targetLanguage && langs.some((x) => x.name === p.targetLanguage);

        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          bio: p.bio ?? "",
          targetLanguage: hasTarget ? p.targetLanguage : "",
          nativeLanguage: p.nativeLanguage ?? "",
          level: p.level ?? "Beginner", // Already in display format from fetchMyProfile
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) {
          setError(`Failed to load profile: ${msg}`);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);


  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload: ProfileAPI = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      bio: form.bio.trim(),
      targetLanguage: form.targetLanguage.trim(),
      nativeLanguage: form.nativeLanguage.trim(),
      level: levelToDB(form.level) // Convert display format to database format
    };

    // super light client validation
    if (!payload.targetLanguage) {
      setSaving(false);
      setError("Target language is required.");
      return;
    }

    try {
      await saveMyProfile(payload);
      router.push("/profile");
    } catch (e) {
      console.error("Error saving profile:", e);
      // Handle Supabase errors which have a different structure
      let msg = "Unknown error";
      if (e && typeof e === 'object') {
        // Supabase PostgREST errors have message, code, details, hint properties
        if ('message' in e && e.message) {
          msg = String(e.message);
        } else if ('details' in e && e.details) {
          msg = String(e.details);
        } else if ('hint' in e && e.hint) {
          msg = String(e.hint);
        } else if ('code' in e) {
          msg = `Database error (code: ${String(e.code)})`;
        }
      } else if (e instanceof Error) {
        msg = e.message;
      }
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="h-10 w-1/2 animate-pulse rounded-xl bg-zinc-200" />
          <div className="mt-4 h-80 animate-pulse rounded-2xl bg-zinc-200" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white w-full">
      <main className="mx-auto max-w-6xl p-6">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Edit Profile</h1>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="First name">
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="e.g. John"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="Last name">
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="e.g. Doe"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <Field label="Bio">
              <textarea
                className="min-h-[110px] w-full resize-y rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="Native language">
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.nativeLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, nativeLanguage: e.target.value }))}
                  placeholder="e.g. English"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="Target language">
                <select
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.targetLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, targetLanguage: e.target.value }))}
                >
                  <option value="" disabled>
                    Select a language...
                  </option>
                  {languages.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="Level">
                <select
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as LevelDisplay }))}
                >
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-50"
              onClick={() => router.push("/profile")}
              disabled={saving}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
      </main>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-zinc-700">{label}</label>
        {hint ? <span className="text-xs text-zinc-600">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

