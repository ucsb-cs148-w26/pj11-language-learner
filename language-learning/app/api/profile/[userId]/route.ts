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

function levelToDisplay(level: string | null | undefined): TargetLanguage["level"] {
  if (!level) return null;
  const lower = level.toLowerCase();
  if (lower === "intermediate") return "Intermediate";
  if (lower === "advanced") return "Advanced";
  return "Beginner";
}

export async function GET(
    _req: NextRequest, 
    { params }: { params: Promise<{ userId: string }> }
    // context: { params: { userId: string } }
) {
  const supabase = await createClient();
  const { userId } = await params;

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("first_name, last_name, bio, native_language, profile_picture_url")
    .eq("user_id", userId)
    .single();

  if (profileError) {
    const status = profileError.code === "PGRST116" ? 404 : 500;
    return NextResponse.json(
      { error: profileError.message || "Failed to load profile" },
      { status }
    );
  }

  const { data: targetLanguagesData, error: targetLanguagesError } = await supabase
    .from("profile_target_languages")
    .select("level, languages!profile_target_languages_language_id_fkey(name)")
    .eq("user_id", userId);

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
    firstName: profileData.first_name,
    lastName: profileData.last_name,
    bio: profileData.bio,
    targetLanguages,
    profilePicture: profileData.profile_picture_url,
    nativeLanguage: profileData.native_language,
  };

  return NextResponse.json({ profile });
}
