import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Public profile fields (no email). Use this RPC when fetching other users' profiles
 * so RLS only exposes safe data.
 */
export type PublicProfileRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  profile_picture_url: string | null;
  native_language: string | null;
  updated_at: string | null;
};

/**
 * Fetch public profile data for the given user IDs (no email).
 * Requires RLS: get_public_profiles() SECURITY DEFINER.
 */
export async function getPublicProfiles(
  supabase: SupabaseClient,
  userIds: string[]
): Promise<PublicProfileRow[]> {
  if (userIds.length === 0) return [];
  const { data, error } = await supabase.rpc("get_public_profiles", {
    uid: userIds,
  });
  if (error) throw error;
  return (data as PublicProfileRow[]) ?? [];
}
