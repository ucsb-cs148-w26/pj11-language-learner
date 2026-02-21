// app/(app)/profile/edit/page.tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

// Database stores lowercase values
type LevelDB = "beginner" | "intermediate" | "advanced";
// UI displays capitalized values
type LevelDisplay = "Beginner" | "Intermediate" | "Advanced";

// Helper functions to convert between database and display formats
function levelToDisplay(level: LevelDB | string | null | undefined): LevelDisplay {
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

type LanguageOption = {
  id: number;
  name: string;
};

type TargetLanguageFormItem = {
  name: string;
  level: LevelDisplay;
};

type ProfileForm = {
  firstName: string;
  lastName: string;
  bio: string;
  nativeLanguage: string;
  targetLanguages: TargetLanguageFormItem[];
};

type ProfileDisplay = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  nativeLanguage?: string | null;
  targetLanguages: TargetLanguageFormItem[];
};

type ProfileAPI = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  nativeLanguage?: string | null;
  targetLanguages: { name: string; level: LevelDB }[];
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
        nativeLanguage: "",
        targetLanguages: [],
      };
    }
    console.error("Profile fetch error:", profileError);
    throw profileError;
  }

  // Fetch target languages from separate table
  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from("profile_target_languages")
    .select("level, languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId);

  console.log("Target languages fetch result:", { targetLanguagesData, targetLanguagesError });
  if (targetLanguagesError) console.error("Target languages fetch error:", targetLanguagesError);

  const targetLanguages: TargetLanguageFormItem[] = (targetLanguagesData ?? [])
    .map((row: any) => {
      const name = row?.languages?.name ?? "";
      if (!name) return null;
      return { name, level: levelToDisplay(row.level) };
    })
    .filter(Boolean) as TargetLanguageFormItem[];

  const result: ProfileDisplay = {
    firstName: profileData.first_name || "",
    lastName: profileData.last_name || "",
    bio: profileData.bio || "",
    nativeLanguage: profileData.native_language || "",
    targetLanguages,
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      email = user?.email || null;
    } catch {
      // ignore
    }
  }

  // Upsert profile
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

  // Replace ALL target languages
  const cleaned = (payload.targetLanguages ?? [])
    .map((t) => ({ name: t.name.trim(), level: t.level }))
    .filter((t) => !!t.name);

  const { error: delErr } = await supabase
    .from("profile_target_languages")
    .delete()
    .eq("user_id", userId);

  if (delErr) throw delErr;

  if (cleaned.length === 0) return;

  // Dedupe by language name
  const seen = new Set<string>();
  const deduped = cleaned.filter((t) => {
    const k = t.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  // Fetch language ids in one query
  const names = deduped.map((t) => t.name);
  const { data: langRows, error: langSelectError } = await supabase
    .from("languages")
    .select("id, name")
    .in("name", names);

  if (langSelectError) throw langSelectError;

  const idByName = new Map<string, number>();
  (langRows ?? []).forEach((r: any) => idByName.set(String(r.name), Number(r.id)));

  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    throw new Error(`Selected language(s) not found in languages table: ${missing.join(", ")}`);
  }

  const inserts = deduped.map((t) => ({
    user_id: userId,
    language_id: idByName.get(t.name)!,
    level: t.level,
  }));

  const { error: insErr } = await supabase.from("profile_target_languages").insert(inserts);
  if (insErr) throw insErr;
}

export default function EditProfilePage() {
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  function onClickAvatar() {
    fileInputRef.current?.click();
  }

  function onAvatarSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image is too large (max 5MB).");
      return;
    }

    setError(null);

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);

    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl(url);

    e.target.value = "";
  }

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    };
  }, [avatarPreviewUrl]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [languages, setLanguages] = useState<LanguageOption[]>([]);

  const [form, setForm] = useState<ProfileForm>({
    firstName: "",
    lastName: "",
    bio: "",
    nativeLanguage: "",
    targetLanguages: [{ name: "", level: "Beginner" }],
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

        const validSet = new Set(langs.map((x) => x.name));
        const filteredTargets = (p.targetLanguages ?? []).filter((t) => validSet.has(t.name));

        setForm({
          firstName: p.firstName ?? "",
          lastName: p.lastName ?? "",
          bio: p.bio ?? "",
          nativeLanguage: p.nativeLanguage ?? "",
          targetLanguages:
            filteredTargets.length > 0 ? filteredTargets : [{ name: "", level: "Beginner" }],
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setError(`Failed to load profile: ${msg}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateTargetLanguage(idx: number, patch: Partial<TargetLanguageFormItem>) {
    setForm((f) => {
      const next = [...f.targetLanguages];
      next[idx] = { ...next[idx], ...patch };
      return { ...f, targetLanguages: next };
    });
  }

  function addTargetLanguageRow() {
    setForm((f) => ({
      ...f,
      targetLanguages: [...f.targetLanguages, { name: "", level: "Beginner" }],
    }));
  }

  function removeTargetLanguageRow(idx: number) {
    setForm((f) => {
      const next = f.targetLanguages.filter((_, i) => i !== idx);
      return { ...f, targetLanguages: next.length ? next : [{ name: "", level: "Beginner" }] };
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const cleaned = form.targetLanguages
      .map((t) => ({ name: t.name.trim(), level: t.level }))
      .filter((t) => t.name.length > 0);

    if (!form.firstName.trim()) {
      setSaving(false);
      setError("First name is required.");
      return;
    }
    if (!form.nativeLanguage.trim()) {
      setSaving(false);
      setError("Native language is required.");
      return;
    }
    if (cleaned.length === 0) {
      setSaving(false);
      setError("At least one target language is required.");
      return;
    }

    // Prevent duplicates on client
    const seen = new Set<string>();
    for (const t of cleaned) {
      const k = t.name.toLowerCase();
      if (seen.has(k)) {
        setSaving(false);
        setError(`Duplicate target language: ${t.name}`);
        return;
      }
      seen.add(k);
    }

    const payload: ProfileAPI = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      bio: form.bio.trim(),
      nativeLanguage: form.nativeLanguage.trim(),
      targetLanguages: cleaned.map((t) => ({
        name: t.name,
        level: levelToDB(t.level),
      })),
    };

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

  const chosenNamesLower = form.targetLanguages
    .map((t) => t.name.trim().toLowerCase())
    .filter(Boolean);

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
            {/* Avatar uploader */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClickAvatar}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-zinc-100 border border-zinc-200"
              aria-label="Upload profile photo"
            >
              {avatarPreviewUrl ? (
                <img
                  src={avatarPreviewUrl}
                  alt="Uploaded avatar preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </button>

            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-900">Profile photo</p>
              <p className="text-xs text-zinc-600">Click the avatar to upload a new one (max 5MB).</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onAvatarSelected}
            />
          </div>
        </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="First name" required>
                <input
                  required
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
              <Field label="Native language" required>
                <select
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.nativeLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, nativeLanguage: e.target.value }))}
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
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-900">Target languages</p>
                <p className="text-xs text-zinc-600">Add one or more languages you are learning.</p>
              </div>
              <button
                type="button"
                onClick={addTargetLanguageRow}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                disabled={saving}
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {form.targetLanguages.map((t, idx) => {
                const currentLower = t.name.trim().toLowerCase();
                return (
                  <div
                    key={`${idx}-${t.name}-${t.level}`}
                    className="rounded-2xl border border-zinc-200 bg-white p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_44px] items-end">
                      <Field label="Language" required>
                        <select
                          required
                          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                          value={t.name}
                          onChange={(e) => updateTargetLanguage(idx, { name: e.target.value })}
                        >
                          <option value="" disabled>
                            Select a language...
                          </option>
                          {languages.map((l) => {
                            const lower = l.name.toLowerCase();
                            const alreadyChosenElsewhere =
                              lower !== currentLower && chosenNamesLower.includes(lower);
                            return (
                              <option key={l.id} value={l.name} disabled={alreadyChosenElsewhere}>
                                {l.name}
                              </option>
                            );
                          })}
                        </select>
                      </Field>

                      <Field label="Level">
                        <select
                          className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                          value={t.level}
                          onChange={(e) =>
                            updateTargetLanguage(idx, { level: e.target.value as LevelDisplay })
                          }
                        >
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </Field>

                      <button
                        type="button"
                        onClick={() => removeTargetLanguageRow(idx)}
                        className="h-10 w-10 rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        aria-label="Remove target language"
                        disabled={saving}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
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
  required,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-end justify-between gap-3">
        <label className="text-sm font-medium text-zinc-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {hint ? <span className="text-xs text-zinc-600">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
