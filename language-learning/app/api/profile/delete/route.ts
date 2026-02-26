import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function POST() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (!user || userError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: deleteAuthError } = await supabase.rpc("delete_user_account", { user_uuid: user.id });

  if (deleteAuthError) {
    return NextResponse.json(
      { error: deleteAuthError.message || "Delete account failed", code: deleteAuthError.code },
      { status: 500 }
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
