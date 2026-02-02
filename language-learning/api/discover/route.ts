import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const languageFilter = searchParams.get("language");
  const levelFilter = searchParams.get("level");
  const isRecommended = searchParams.get("recommended") === "true";

  // auth check
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const currentUserId = session.user.id;

  let query = supabaseClient
    .from("profiles")
    .select(`
      user_id, 
      first_name, 
      level, 
      profile_target_languages!inner(language)
    `)
    .neq('user_id', currentUserId);

  if (levelFilter && levelFilter !== "All") {
    query = query.eq('level', levelFilter);
  }

  if (languageFilter && languageFilter.trim() !== "") {
    query = query.ilike('profile_target_languages.language', `%${languageFilter}%`);
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

  const partners = (profiles || []).map((p: any) => ({
    id: p.user_id,
    first_name: p.first_name,
    level: p.level,
    target_language: p.profile_target_languages?.language || "None",
  }));

  return NextResponse.json(partners);
}