import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

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

type ProfilePayload = {
  firstName?: string | null;
  lastName?: string | null;
  bio?: string | null;
  nativeLanguage?: string | null;
  targetLanguages?: Array<{ name: string; level: string }>;
};

function levelToDisplay(level: string | null | undefined): TargetLanguage["level"] {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, bio, native_language, profile_picture_url")
    .eq("user_id", user.id)
    .single();

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { error: profileError.message || "Failed to load profile" },
      { status: 500 }
    );
  }

  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from("profile_target_languages")
    .select("level, languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", user.id);

  if (targetLanguagesError) {
    return NextResponse.json(
      { error: targetLanguagesError.message || "Failed to load target languages" },
      { status: 500 }
    );
  }

  const targetLanguages: TargetLanguage[] = (targetLanguagesData ?? [])
    .map((row: any) => {
      const name = row?.languages?.name ?? null;
      if (!name) return null;
      return { name, level: levelToDisplay(row.level) };
    })
    .filter(Boolean) as TargetLanguage[];

  const profile: Profile = {
    firstName: profileData?.first_name ?? null,
    lastName: profileData?.last_name ?? null,
    bio: profileData?.bio ?? null,
    targetLanguages,
    profilePicture: profileData?.profile_picture_url ?? null,
    nativeLanguage: profileData?.native_language ?? null,
  };

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await req.json()) as ProfilePayload;

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("email")
    .eq("user_id", user.id)
    .single();

  let email: string | null = existingProfile?.email || null;
  if (!email) {
    email = user.email || null;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: user.id,
        email,
        first_name: payload.firstName?.trim() || null,
        last_name: payload.lastName?.trim() || null,
        bio: payload.bio || null,
        native_language: payload.nativeLanguage?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (profileError) {
    return NextResponse.json({ error: profileError.message || "Profile update failed" }, { status: 500 });
  }

  const cleaned = (payload.targetLanguages ?? [])
    .map((t) => ({ name: t.name.trim(), level: t.level }))
    .filter((t) => !!t.name);

  const { error: delErr } = await supabase
    .from("profile_target_languages")
    .delete()
    .eq("user_id", user.id);

  if (delErr) {
    return NextResponse.json({ error: delErr.message || "Failed to update target languages" }, { status: 500 });
  }

  if (cleaned.length === 0) {
    return NextResponse.json({ success: true });
  }

  const seen = new Set<string>();
  const deduped = cleaned.filter((t) => {
    const k = t.name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });

  const names = deduped.map((t) => t.name);
  const { data: langRows, error: langSelectError } = await supabase
    .from("languages")
    .select("id, name")
    .in("name", names);

  if (langSelectError) {
    return NextResponse.json({ error: langSelectError.message || "Failed to resolve languages" }, { status: 500 });
  }

  const idByName = new Map<string, number>();
  (langRows ?? []).forEach((r: any) => idByName.set(String(r.name), Number(r.id)));

  const missing = names.filter((n) => !idByName.has(n));
  if (missing.length > 0) {
    return NextResponse.json({ error: `Selected language(s) not found: ${missing.join(", ")}` }, { status: 400 });
  }

  const inserts = deduped.map((t) => ({
    user_id: user.id,
    language_id: idByName.get(t.name)!,
    level: t.level,
  }));

  const { error: insErr } = await supabase.from("profile_target_languages").insert(inserts);
  if (insErr) {
    return NextResponse.json({ error: insErr.message || "Failed to update target languages" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
