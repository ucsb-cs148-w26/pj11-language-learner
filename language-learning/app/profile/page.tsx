// app/(app)/profile/page.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Profile = {
  displayName?: string | null;
  bio?: string | null;
  targetLanguage?: string | null;
  level?: "Beginner" | "Intermediate" | "Advanced" | null;
  profilePhotoUrl?: string | null;
  nativeLanguages?: string[] | null;
};

type LoadState<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "success"; data: T };

async function fetchMyProfile(): Promise<Profile> {
  // TODO: Replace with Supabase call when API is ready
  // Example Supabase call:
  // const { data, error } = await supabase
  //   .from('profiles')
  //   .select('display_name, bio, target_language, level, profile_photo_url, native_languages')
  //   .eq('user_id', userId)
  //   .single();
  // if (error) throw error;
  // return { displayName: data.display_name, ... };
  
  // THIS IS A STUB!! (will connect to Supabase when API is ready)
  try {
    const res = await fetch("/api/profile", { method: "GET" });
    if (!res.ok) throw new Error(`Request failed: ${res.status}`);
    return (await res.json()) as Profile;
  } catch {
    // Mock fallback for development
    // Remove this when Supabase is connected
    return {
      displayName: null,
      bio: null,
      targetLanguage: null,
      level: null,
      profilePhotoUrl: null,
      nativeLanguages: ["English"],
    };
  }
}

export default function ProfilePage() {
  const [state, setState] = useState<LoadState<Profile>>({ status: "loading" });
  const [nameInput, setNameInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [targetLanguageInput, setTargetLanguageInput] = useState("");
  const [levelInput, setLevelInput] = useState<"Beginner" | "Intermediate" | "Advanced" | "">("");
  const [nativeLanguagesInput, setNativeLanguagesInput] = useState("");
  const [isSaving, setIsSaving] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMyProfile();
        if (!cancelled) {
          setState({ status: "success", data });
          setNameInput(data.displayName || "");
          setBioInput(data.bio || "");
          setTargetLanguageInput(data.targetLanguage || "");
          setLevelInput(data.level || "");
          setNativeLanguagesInput(data.nativeLanguages?.join(", ") || "");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        if (!cancelled) setState({ status: "error", message: msg });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (field: string) => {
    setIsSaving(field);
    try {
      // TODO: Replace with Supabase call when API is ready
      // Example Supabase call:
      // const updateData: Record<string, any> = {};
      // if (field === "name") updateData.display_name = nameInput.trim();
      // else if (field === "bio") updateData.bio = bioInput.trim();
      // else if (field === "targetLanguage") updateData.target_language = targetLanguageInput.trim();
      // else if (field === "level") updateData.level = levelInput;
      // else if (field === "nativeLanguages") updateData.native_languages = nativeLanguagesInput.split(",").map(s => s.trim());
      // const { error } = await supabase.from('profiles').update(updateData).eq('user_id', userId);
      // if (error) throw error;
      
      // Temporary stub - remove when Supabase is connected
      await new Promise((resolve) => setTimeout(resolve, 500));
      setState((prev) => {
        if (prev.status === "success") {
          const updates: Partial<Profile> = {};
          if (field === "name") {
            updates.displayName = nameInput.trim() || null;
          } else if (field === "bio") {
            updates.bio = bioInput.trim() || null;
          } else if (field === "targetLanguage") {
            updates.targetLanguage = targetLanguageInput.trim() || null;
          } else if (field === "level") {
            updates.level = (levelInput || null) as "Beginner" | "Intermediate" | "Advanced" | null;
          } else if (field === "nativeLanguages") {
            updates.nativeLanguages = nativeLanguagesInput
              .split(",")
              .map((l) => l.trim())
              .filter((l) => l.length > 0);
          }
          return {
            status: "success" as const,
            data: { ...prev.data, ...updates },
          };
        }
        return prev;
      });
    } catch (e) {
      alert(`Failed to save ${field}`);
    } finally {
      setIsSaving(null);
    }
  };

  if (state.status === "loading") {
    return (
      <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">
        <div className="h-10 w-1/2 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-4 h-40 animate-pulse rounded-2xl bg-zinc-200" />
      </main>
    );
  }

  if (state.status === "error") {
    return (
      <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">Couldn't load profile</p>
          <p className="mt-1 text-sm text-red-700">{state.message}</p>
        </div>
      </main>
    );
  }

  const p = state.data;

  return (
    <main className="mx-auto max-w-6xl p-6 bg-white min-h-screen">
      <div className="space-y-6">
        {/* Header */}
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Profile</h1>
        </header>

        {/* Profile Card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              {p.profilePhotoUrl ? (
                <img
                  src={p.profilePhotoUrl}
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
                {p.displayName || "Your Name"}
              </h2>
              <div className="mt-2 space-y-1">
                {p.targetLanguage && (
                  <p className="text-sm text-zinc-700">
                    <span className="font-medium">Learning:</span> {p.targetLanguage}
                    {p.level && ` • ${p.level}`}
                  </p>
                )}
                {p.nativeLanguages && p.nativeLanguages.length > 0 && (
                  <p className="text-sm text-zinc-700">
                    <span className="font-medium">Native:</span> {p.nativeLanguages.join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Editable Fields */}
        <section className="space-y-4">
          {/* Name */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Name</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleSave("name")}
              />
              <button
                onClick={() => handleSave("name")}
                disabled={isSaving === "name"}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving === "name" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Native Languages */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Native Languages</label>
            <p className="text-xs text-zinc-600 mb-3">Separate multiple languages with commas</p>
            <div className="flex gap-3">
              <input
                type="text"
                value={nativeLanguagesInput}
                onChange={(e) => setNativeLanguagesInput(e.target.value)}
                placeholder="e.g., English, Spanish"
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleSave("nativeLanguages")}
              />
              <button
                onClick={() => handleSave("nativeLanguages")}
                disabled={isSaving === "nativeLanguages"}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving === "nativeLanguages" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Target Language */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Target Language</label>
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                value={targetLanguageInput}
                onChange={(e) => setTargetLanguageInput(e.target.value)}
                placeholder="e.g., Japanese, Spanish, French"
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleSave("targetLanguage")}
              />
              <button
                onClick={() => handleSave("targetLanguage")}
                disabled={isSaving === "targetLanguage"}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving === "targetLanguage" ? "Saving..." : "Save"}
              </button>
            </div>
            <div className="flex gap-3">
              <select
                value={levelInput}
                onChange={(e) => setLevelInput(e.target.value as "Beginner" | "Intermediate" | "Advanced" | "")}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent"
              >
                <option value="">Select proficiency level</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
              <button
                onClick={() => handleSave("level")}
                disabled={!levelInput || isSaving === "level"}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving === "level" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Bio */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <label className="block text-sm font-medium text-zinc-700 mb-2">Bio</label>
            <div className="flex flex-col gap-3">
              <textarea
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
                className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:border-transparent resize-none"
              />
              <button
                onClick={() => handleSave("bio")}
                disabled={isSaving === "bio"}
                className="self-end rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving === "bio" ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

