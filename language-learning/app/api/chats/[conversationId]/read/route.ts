import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;

  const { data: membership, error: memberErr } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (memberErr) {
    return NextResponse.json(
      { error: memberErr.message || "Failed to verify membership" },
      { status: 500 }
    );
  }

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: updateErr } = await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", user.id)
    .is("read_at", null);

  if (updateErr) {
    return NextResponse.json(
      { error: updateErr.message || "Failed to mark as read" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}