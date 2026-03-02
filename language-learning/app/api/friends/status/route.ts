import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createFriendService } from "@/utils/friends/friendService";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("targetUserId");

  if (!targetUserId) {
    return NextResponse.json({ error: "targetUserId is required" }, { status: 400 });
  }

  if (!user) {
    return NextResponse.json({ viewerId: null, status: null });
  }

  const friends = createFriendService(supabase);
  try {
    const status = await friends.getRelationshipStatus({ viewerId: user.id, otherUserId: targetUserId });
    return NextResponse.json({ viewerId: user.id, status });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load relationship status" }, { status: 500 });
  }
}
