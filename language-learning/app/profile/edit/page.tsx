// app/(app)/profile/edit/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Level = "Beginner" | "Intermediate" | "Advanced";

type ProfileForm = {
  displayName: string;
  bio: string;
  targetLanguage: string;
  level: Level;
};

type ProfileAPI = {
  displayName: string;
  bio?: string | null;
  targetLanguage: string;
  level: Level;
};

async function fetchMyProfile(): Promise<ProfileAPI> {
  // TODO: Replace with Supabase call when API is ready
  // Example Supabase call:
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .select('display_name, bio, target_language, level')
  //   .eq('user_id', userId)
  //   .single();
  // if (error) throw error;
  // return { displayName: data.display_name, ... };
  
  try {
    const res = await fetch("/api/profile", { method: "GET" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as ProfileAPI;
  } catch (error) {
    // Fallback to mock data for development
    // Remove this when Supabase is connected
    console.warn("API not available, using mock data:", error);
    throw error; // Let caller handle fallback
  }
}

async function saveMyProfile(payload: ProfileAPI): Promise<void> {
  // TODO: Replace with Supabase call when API is ready
  // Example Supabase call:
  // const { error } = await supabase
  //   .from('profiles')
  //   .update({
  //     display_name: payload.displayName,
  //     bio: payload.bio,
  //     target_language: payload.targetLanguage,
  //     level: payload.level,
  //     updated_at: new Date().toISOString()
  //   })
  //   .eq('user_id', userId);
  // if (error) throw error;
  
  try {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(text || `Save failed: ${res.status}`);
    }
  } catch (error) {
    // Log error for debugging
    console.error("Failed to save profile:", error);
    throw error;
  }
}


export default function EditProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<ProfileForm>({
    displayName: "",
    bio: "",
    targetLanguage: "",
    level: "Beginner",
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        // If backend isn't ready yet, you can temporarily wrap this in try/catch
        // and set default form values.
        const p = await fetchMyProfile();

        if (cancelled) return;

        setForm({
          displayName: p.displayName ?? "",
          bio: p.bio ?? "",
          targetLanguage: p.targetLanguage ?? "",
          level: p.level ?? "Beginner",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) {
          // Frontend fallback if API not available yet:
          setForm({
            displayName: "Jovia",
            bio: "Trying to get consistent practice.",
            targetLanguage: "Japanese",
            level: "Beginner",
          });
          setError(`Using mock data (API not ready): ${msg}`);
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
      displayName: form.displayName.trim(),
      bio: form.bio.trim(),
      targetLanguage: form.targetLanguage.trim(),
      level: form.level
    };

    // super light client validation
    if (!payload.displayName) {
      setSaving(false);
      setError("Display name is required.");
      return;
    }
    if (!payload.targetLanguage) {
      setSaving(false);
      setError("Target language is required.");
      return;
    }

    try {
      await saveMyProfile(payload);
      router.push("/profile");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      setError(msg);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-4 h-80 animate-pulse rounded-2xl bg-zinc-200" />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">
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
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <Field label="Display name">
              <input
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                value={form.displayName}
                onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
                placeholder="e.g. Jovia"
              />
            </Field>
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
              <Field label="Target language">
                <input
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.targetLanguage}
                  onChange={(e) => setForm((f) => ({ ...f, targetLanguage: e.target.value }))}
                  placeholder="e.g. Japanese"
                />
              </Field>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6">
              <Field label="Level">
                <select
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                  value={form.level}
                  onChange={(e) => setForm((f) => ({ ...f, level: e.target.value as Level }))}
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

