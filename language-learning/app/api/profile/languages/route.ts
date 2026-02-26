import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("languages")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message || "Failed to load languages" }, { status: 500 });
  }

  return NextResponse.json({ languages: data ?? [] });
}
