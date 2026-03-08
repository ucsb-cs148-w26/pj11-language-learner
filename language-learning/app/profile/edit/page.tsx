// app/(app)/profile/edit/page.tsx
"use client";

import { useEffect, useRef, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "obscenity";

// Database stores lowercase values
type LevelDB = "beginner" | "intermediate" | "advanced";
// UI displays capitalized values
type LevelDisplay = "Beginner" | "Intermediate" | "Advanced";

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
  profilePicture?: string | null;
};

type ProfileAPI = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  nativeLanguage?: string | null;
  targetLanguages: { name: string; level: LevelDB }[];
};

async function fetchLanguages(): Promise<LanguageOption[]> {
  const res = await fetch("/api/profile/languages");
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Failed to load languages");
  return (body.languages ?? []) as LanguageOption[];
}

async function fetchMyProfile(): Promise<ProfileDisplay> {
  const res = await fetch("/api/profile/me");
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Failed to load profile");

  const data = body.profile as ProfileDisplay;

  return {
    firstName: data.firstName || "",
    lastName: data.lastName || "",
    bio: data.bio || "",
    nativeLanguage: data.nativeLanguage || "",
    targetLanguages: data.targetLanguages ?? [],
    profilePicture: data.profilePicture ?? null,
  };
}

async function saveMyProfile(payload: ProfileAPI): Promise<void> {
  const res = await fetch("/api/profile/me", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.error || "Failed to save profile");
}

const profanityMatcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

function censorProfanity(input: string): string {
  const matches = profanityMatcher.getAllMatches(input, true);
  let out = input;

  for (let i = matches.length - 1; i >= 0; i--) {
    const { startIndex, endIndex } = englishDataset.getPayloadWithPhraseMetadata(matches[i]);
    out = out.slice(0, startIndex) + "*".repeat(endIndex - startIndex) + out.slice(endIndex);
  }

  return out;
}

function EditProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

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
    setRemoveAvatar(false);

    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);

    const url = URL.createObjectURL(file);
    setAvatarPreviewUrl(url);
    setSelectedFile(file);

    e.target.value = "";
  }

  function onRemoveAvatar() {
    if (avatarPreviewUrl) URL.revokeObjectURL(avatarPreviewUrl);
    setAvatarPreviewUrl(null);
    setSelectedFile(null);
    setRemoveAvatar(true);
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
        setCurrentAvatarUrl(p.profilePicture ?? null);

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

    const firstName = censorProfanity(form.firstName.trim());
    const lastName = censorProfanity(form.lastName.trim());
    const bio = censorProfanity(form.bio.trim());

    const payload: ProfileAPI = {
      firstName,
      lastName,
      bio,
      nativeLanguage: form.nativeLanguage.trim(),
      targetLanguages: cleaned.map((t) => ({
        name: t.name,
        level: levelToDB(t.level),
      })),
    };

    try {
      // Handle avatar changes before saving profile fields
      let avatarChanged = false;
      if (removeAvatar) {
        await fetch("/api/profile/avatar", { method: "DELETE" });
        avatarChanged = true;
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("avatar", selectedFile);
        const res = await fetch("/api/profile/avatar", { method: "POST", body: formData });
        if (!res.ok) {
          const body = await res.json();
          throw new Error(body?.error || "Failed to upload avatar");
        }
        avatarChanged = true;
      }

      await saveMyProfile(payload);
      if (avatarChanged) window.dispatchEvent(new CustomEvent("avatar-changed"));
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
      <div className="min-h-screen bg-background w-full">
        <main className="mx-auto max-w-6xl p-6">
          <div className="h-10 w-1/2 animate-pulse rounded-xl bg-gray-border-soft" />
          <div className="mt-4 h-80 animate-pulse rounded-2xl bg-gray-border-soft" />
        </main>
      </div>
    );
  }

  const chosenNamesLower = form.targetLanguages
    .map((t) => t.name.trim().toLowerCase())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-background w-full">
      <main className="mx-auto max-w-6xl p-6">
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-text">Edit Profile</h1>
        </header>

        {error && (
          <div className="rounded-2xl border border-dark-red/20 bg-light-red p-4">
            <p className="text-sm text-dark-red">{error}</p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
            {/* Avatar uploader */}
        <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onClickAvatar}
              className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-off-white border border-gray-border-soft"
              aria-label="Upload profile photo"
            >
              {(() => {
                const displayUrl = avatarPreviewUrl ?? (removeAvatar ? null : currentAvatarUrl);
                return displayUrl ? (
                  <img
                    src={displayUrl}
                    alt="Profile photo"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-10 w-10 text-gray-muted-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                );
              })()}
            </button>

            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-text">Profile photo</p>
              <p className="text-xs text-gray-muted">Click the avatar to upload a new one (max 5MB).</p>
              {(avatarPreviewUrl || (!removeAvatar && currentAvatarUrl)) && (
                <button
                  type="button"
                  onClick={onRemoveAvatar}
                  className="text-xs text-dark-red hover:underline"
                >
                  Remove photo
                </button>
              )}
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
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <Field label="First name" required>
                <input
                  required
                  className="w-full rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text placeholder:text-gray-muted-2 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="e.g. John"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <Field label="Last name">
                <input
                  className="w-full rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text placeholder:text-gray-muted-2 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="e.g. Doe"
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
            <Field label="Bio">
              <textarea
                className="min-h-[110px] w-full resize-y rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text placeholder:text-gray-muted-2 focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                placeholder="Tell others about yourself..."
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-border-soft bg-white p-6">
              <Field label="Native language" required>
                <select
                  required
                  className="w-full rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
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

          <div className="rounded-2xl border border-gray-border-soft bg-white p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-text">Target languages</p>
                <p className="text-xs text-gray-muted">Add one or more languages you are learning.</p>
              </div>
              <button
                type="button"
                onClick={addTargetLanguageRow}
                className="rounded-xl border border-gray-border-soft bg-white px-3 py-2 text-sm font-medium text-gray-text hover:bg-off-white"
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
                    className="rounded-2xl border border-gray-border-soft bg-white p-4"
                  >
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_44px] items-end">
                      <Field label="Language" required>
                        <select
                          required
                          className="w-full rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
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
                          className="w-full rounded-xl border border-gray-border bg-white px-4 py-2 text-sm text-gray-text focus:outline-none focus:ring-2 focus:ring-blue/20 focus:border-transparent"
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
                        className="h-10 w-10 rounded-xl border border-gray-border-soft bg-white text-gray-muted hover:bg-off-white"
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
            {!isNew && (
              <button
                type="button"
                className="rounded-xl border border-gray-border-soft bg-white px-4 py-2 text-sm font-medium hover:bg-off-white"
                onClick={() => router.push("/profile")}
                disabled={saving}
              >
                Cancel
              </button>
            )}

            <button
              type="submit"
              className="rounded-xl bg-gray-text px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
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

export default function EditProfilePage() {
  return (
    <Suspense>
      <EditProfilePageContent />
    </Suspense>
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
        <label className="text-sm font-medium text-gray-muted">
          {label}
          {required && <span className="text-dark-red ml-1">*</span>}
        </label>
        {hint ? <span className="text-xs text-gray-muted">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}
