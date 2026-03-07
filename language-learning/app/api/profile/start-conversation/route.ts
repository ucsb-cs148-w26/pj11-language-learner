import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (!user || authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { partnerId } = await req.json();
  if (!partnerId) {
    return NextResponse.json({ error: "partnerId is required" }, { status: 400 });
  }

  const { data, error } = await supabase.rpc("start_conversation_no_dupe", {
    partner_id: partnerId,
  });

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to start conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversationId: data as string });
}
