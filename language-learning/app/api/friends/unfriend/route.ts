import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createFriendService } from "@/utils/friends/friendService";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { otherUserId } = await req.json();
  if (!otherUserId) {
    return NextResponse.json({ error: "otherUserId is required" }, { status: 400 });
  }

  const friends = createFriendService(supabase);
  try {
    await friends.unfriend({ otherUserId });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to unfriend" }, { status: 500 });
  }
}
