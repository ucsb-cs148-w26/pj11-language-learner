import { NextRequest, NextResponse } from "next/server";
import { supabase as supabaseClient } from "@/lib/supabaseClient";
import { coerceProfileRow, getSupabaseOrError, jsonError, parsePatchProfileInput } from "../_shared";

type SupabaseClient = typeof supabaseClient;

type Params = {
  params: Promise<{
    user_id: string;
  }>;
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

  const { user_id } = await params;
  const userId = user_id?.trim();
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
 * PATCH /api/profile/{user_id}
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const supabaseResult = getSupabaseOrError();
  if (!supabaseResult.ok) return supabaseResult.response;
  const supabase = supabaseResult.client;

  const { user_id } = await params;
  const userId = user_id?.trim();
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

  // update profiles
  const { data: updatedBase, error: updErr } = await supabase
    .from("profiles")
    .update(updatePayload)
    .eq("user_id", userId)
    .select("user_id")
    .maybeSingle();

  if (updErr) return jsonError(500, "Internal Server Error", { supabase: updErr });
  if (!updatedBase) return jsonError(404, "Profile not found", { user_id: userId });

  // replace target_languages
  if (target_languages !== undefined) {
    const { error: delErr } = await supabase.from("profile_target_languages").delete().eq("user_id", userId);
    if (delErr) return jsonError(500, "Internal Server Error", { supabase: delErr });

    const rows = target_languages.map((lang) => ({ user_id: userId, language: lang }));
    if (rows.length) {
      const { error: insErr } = await supabase.from("profile_target_languages").insert(rows);
      if (insErr) return jsonError(500, "Internal Server Error", { supabase: insErr });
    }
  }

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

  const { user_id } = await params;
  const userId = user_id?.trim();
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
