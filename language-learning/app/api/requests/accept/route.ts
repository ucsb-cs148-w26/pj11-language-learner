import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";
import { createFriendService } from "@/utils/friends/friendService";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestId = body?.requestId as string | undefined;

    if (!requestId) {
      return NextResponse.json({ error: "Missing requestId" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (!user || authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const friendSvc = createFriendService(supabase);
    const conversationId = await friendSvc.acceptFriendRequest({ requestId });

    if (!conversationId) {
      return NextResponse.json(
        { error: "Accept succeeded but no conversationId was returned." },
        { status: 500 }
      );
    }

    return NextResponse.json({ conversationId });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to accept request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}