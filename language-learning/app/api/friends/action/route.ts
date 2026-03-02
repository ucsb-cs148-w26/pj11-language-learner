// app/api/friends/action/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@/lib/supabaseServer';
import { createFriendService } from "@/utils/friends/friendService";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const friends = createFriendService(supabase);
  const { targetUserId, action, request_id } = await req.json();
  console.log("DEBUG: Action:", action, "| RequestID:", request_id);

  try {
    switch (action) {
      case "send":
        const newReq = await friends.sendFriendRequest({ 
          requesterId: user.id, 
          recipientId: targetUserId 
        });
        return NextResponse.json({ success: true, request_id: newReq.id });
      case "accept": {
        const conversationId = await friends.acceptFriendRequest({ requestId: request_id });
        return NextResponse.json({ success: true, conversationId });
      }
      case "cancel":
        console.log("Cancelling Request ID:", request_id);
        if (!request_id) throw new Error("Server received null request_id for cancel");
        await friends.cancelFriendRequest({ requestId: request_id });
        break;
      case "deny":
        await friends.denyFriendRequest({ requestId: request_id });
        break;
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("SERVER CRASH:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}