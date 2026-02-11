import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabaseServer'

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const languageFilter = searchParams.get("language");
  const levelFilter = searchParams.get("level");
  const isRecommended = searchParams.get("recommended") === "true";

  let query = supabase
    .from("profiles")
    .select(`
      user_id, 
      first_name, 
      profile_target_languages!inner(language_id, level)
    `)
    .neq('user_id', user.id);

  if (levelFilter && levelFilter !== "All") {
    query = query.ilike('profile_target_languages.level', levelFilter);
  }

  if (languageFilter && languageFilter.trim() !== "") {
    query = query.ilike('profile_target_languages.language_id', `%${languageFilter}%`);
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
    level: p.profile_target_languages[0]?.level,
    target_language: p.profile_target_languages[0]?.language_id || "None",
  }));
  
  return NextResponse.json(partners);
}