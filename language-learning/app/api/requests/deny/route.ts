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
    await friendSvc.denyFriendRequest({ requestId });

    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to deny request";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}