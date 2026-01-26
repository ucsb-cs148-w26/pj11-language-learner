import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
type SupabaseClient = typeof supabaseClient;
import {
  coerceProfileRow,
  getSupabaseOrError,
  jsonError,
  parseCreateProfileInput,
  parsePatchProfileInput,
} from "./_shared";

type Params = {
  params: {
    user_id: string;
  };
};

async function fetchFullProfile(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("profiles")
    .select(
      `
      *,
      profile_target_languages(language)
    `
    )
    .eq("user_id", userId)
    .maybeSingle();
}

/**
 * GET /api/profile/{user_id}
 */
export async function GET(_: NextRequest, { params }: Params) {
  const supabaseResult = getSupabaseOrError();
  if (!supabaseResult.ok) return supabaseResult.response;
  const supabase = supabaseResult.client;

  const userId = params.user_id?.trim();
  if (!userId) {
    return jsonError(400, "Validation error", {
      user_id: "user_id path param is required",
    });
  }

  const { data, error } = await fetchFullProfile(supabase, userId);

  if (error) return jsonError(500, "Internal Server Error", { supabase: error });
  if (!data) return jsonError(404, "Profile not found", { user_id: userId });

  return NextResponse.json(coerceProfileRow(data), { status: 200 });
}

/**
 * POST /api/profile
 */
export async function POST(req: NextRequest) {
  const supabaseResult = getSupabaseOrError();
  if (!supabaseResult.ok) return supabaseResult.response;
  const supabase = supabaseResult.client;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const parsed = parseCreateProfileInput(body);
  if (!parsed.ok) {
    return jsonError(400, "Validation error", parsed.details);
  }

  const userId = parsed.value.user_id;

  const { data: existing, error: existingError } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) return jsonError(500, "Internal Server Error", { supabase: existingError });
  if (existing) {
    return jsonError(409, "Profile already exists for user_id", { user_id: userId });
  }

  const nowIso = new Date().toISOString();

  const { error: insertProfileErr } = await supabase.from("profiles").insert({
    user_id: userId,
    email: parsed.value.email,
    first_name: parsed.value.first_name,
    last_name: parsed.value.last_name,
    level: parsed.value.level,
    native_language: parsed.value.native_language,
    bio: parsed.value.bio,
    profile_picture_url: null,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (insertProfileErr) {
    return jsonError(500, "Internal Server Error", { supabase: insertProfileErr });
  }

  // 2) insert into child tables（批量插入）
  const tlRows = parsed.value.target_languages.map((lang) => ({
    user_id: userId,
    language: lang,
  }));

  const { error: tlErr } = tlRows.length
    ? await supabase.from("profile_target_languages").insert(tlRows)
    : { error: null };

  if (tlErr) {
    // rollback when failed, delete profiles（cascade 会清子表）
    await supabase.from("profiles").delete().eq("user_id", userId);
    return jsonError(500, "Internal Server Error", { supabase: tlErr });
  }

  // 3) fetch full profile and return
  const { data, error } = await fetchFullProfile(supabase, userId);
  if (error || !data) return jsonError(500, "Internal Server Error", { supabase: error });

  return NextResponse.json(coerceProfileRow(data), { status: 201 });
}

/**
 * PATCH /api/profile/{user_id}
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabaseResult = getSupabaseOrError();
  if (!supabaseResult.ok) return supabaseResult.response;
  const supabase = supabaseResult.client;

  const userId = params.user_id?.trim();
  if (!userId) {
    return jsonError(400, "Validation error", {
      user_id: "user_id path param is required",
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON");
  }

  const parsed = parsePatchProfileInput(body);
  if (!parsed.ok) {
    return jsonError(400, "Validation error", parsed.details);
  }

  const { target_languages, ...profilePatch } = parsed.value;

  const updatePayload: Record<string, unknown> = {
    ...profilePatch,
    updated_at: new Date().toISOString(),
  };

  // Always touch profiles.updated_at to both validate existence and reflect changes
  // even when the request only updates list fields like target_languages.
  const { data: updatedBase, error: updErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (updErr) return jsonError(500, "Internal Server Error", { supabase: updErr });
  if (!updatedBase) return jsonError(404, "Profile not found", { user_id: userId });

  // 2) replace target_languages if provided
  if (target_languages !== undefined) {
    const { error: delErr } = await supabase
      .from("profile_target_languages")
      .delete()
      .eq("user_id", userId);

    if (delErr) return jsonError(500, "Internal Server Error", { supabase: delErr });

    const rows = target_languages.map((lang) => ({ user_id: userId, language: lang }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("profile_target_languages").insert(rows);
      if (insErr) return jsonError(500, "Internal Server Error", { supabase: insErr });
    }
  }

  // 3) fetch full profile and return
  const { data, error } = await fetchFullProfile(supabase, userId);
  if (error) return jsonError(500, "Internal Server Error", { supabase: error });
  if (!data) return jsonError(404, "Profile not found", { user_id: userId });

  return NextResponse.json(coerceProfileRow(data), { status: 200 });
}

/**
 * DELETE /api/profile/{user_id}
 */
export async function DELETE(_: NextRequest, { params }: Params) {
  const supabaseResult = getSupabaseOrError();
  if (!supabaseResult.ok) return supabaseResult.response;
  const supabase = supabaseResult.client;

  const userId = params.user_id?.trim();
  if (!userId) {
    return jsonError(400, "Validation error", {
      user_id: "user_id path param is required",
    });
  }

  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (error) return jsonError(500, "Internal Server Error", { supabase: error });
  if (!data) return jsonError(404, "Profile not found", { user_id: userId });

  return new NextResponse(null, { status: 204 });
}
