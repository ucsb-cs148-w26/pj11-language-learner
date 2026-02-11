import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const languageFilter = searchParams.get("language");
  const levelFilter = searchParams.get("level");
  const isRecommended = searchParams.get("recommended") === "true";

  // auth check TBD
  // const currentUserId = "45c9d31c-0a1f-4b59-8db5-f980e91c8075";

  let query = supabaseClient
    .from("profile_target_languages")
    .select(`
      user_id,
      level,
      profiles!inner(first_name),
      lang:languages!profile_target_languages_language_id_fkey!inner(name)
    `);

  if (levelFilter && levelFilter !== "All") {
    query = query.eq("level", levelFilter.toLowerCase());
  }

  if (languageFilter && languageFilter.trim() !== "") {
    query = query.eq("lang.name", languageFilter.trim());
  }

  // edit for real logic
  if (isRecommended) {
    query = query.limit(5); 
  }

  const { data: profiles, error } = await query;

  if (error) {
    console.error("Supabase Query Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const partners = (profiles || []).map((r: any) => ({
    id: r.user_id,
    first_name: r.profiles?.first_name,
    level: r.level
      ? (r.level.charAt(0).toUpperCase() + r.level.slice(1))
      : "Beginner",
    target_language: r.lang?.name || "None",
  }));
  
  return NextResponse.json(partners);
}